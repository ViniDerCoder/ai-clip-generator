import fs from 'fs';
import fetch from 'node-fetch';
import sharp from 'sharp';

import { askContinueQuestion, askMultipleChoiceQuestion, askQuestion, coloredLog } from '../utils/userInput.js';
import { promptFileSelection } from '../utils/promptFileSelection.js';
import { generateText } from '../utils/ai.js';
import { Config, ContentSource, contentSources } from '../utils/types.js';

const config = JSON.parse(fs.readFileSync('config/config.json', 'utf-8')) as Config;


(await import('dotenv')).config();
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
if (!PEXELS_API_KEY) {
    coloredLog("error", "Please set the PEXELS_API_KEY environment variable.");
    process.exit(1);
}

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;
if (!PIXABAY_API_KEY) {
    coloredLog("error", "Please set the PIXABAY_API_KEY environment variable.");
    process.exit(1);
}


export async function downloadContent(topic: string, scriptPath: string, amount: number, folderPath: string) {
    coloredLog("title", "\n\nDownloading Content");

    const type = await askMultipleChoiceQuestion('Select content type', ['Images', 'Videos', 'Both'], 'Videos');

    const searchQueryType = await askMultipleChoiceQuestion('Select search query type', ['Generate', 'Use Topic', 'Custom'], 'Generate');

    let searchQuery = topic

    if (searchQueryType === 'Generate') {
        const script = fs.readFileSync(scriptPath, 'utf-8');
        const promptContent = await promptFileSelection('searchQueryGeneration', config.defaults.prompts.searchQueryGenerationPrompt, config.automaticMode);

        const generatedSearchQuery = await generateText(promptContent, [{ name: 'topic', value: topic }, { name: 'script', value: script }]);
        if (!generatedSearchQuery) {
            coloredLog("error", 'Failed to generate script.');
            return await downloadContent(topic, scriptPath, amount, folderPath);
        } else searchQuery = generatedSearchQuery;

    } else if (searchQueryType === 'Custom') {
        searchQuery = await askQuestion('Enter search query') || topic;
    }

    coloredLog("normal", `Using search query: ${searchQuery}`);


    const searchSource = await askMultipleChoiceQuestion('Select search source', [...contentSources], 'pexels');
    const source = searchSource as ContentSource;

    if (type === 'Videos' || type === 'Both') {
        coloredLog("question", "\nDownloading Videos");

        const videos = await getVideos(source, searchQuery, amount)

        if (!videos) return;

        for (let i = 0; i < videos.length; i++) {

            coloredLog("normal", `Downloading video ${i + 1} of ${amount}`);
            coloredLog("debug", `Video URL: ${videos[i].url}`);

            fs.writeFileSync(`${folderPath}/${videos[i].id}.mp4`, await (await fetch(videos[i].url)).buffer());
        }


        coloredLog("success", `Downloaded ${amount} videos for topic ${topic}`);
    }
    if (type === "Images" || type === "Both") {
        coloredLog("question", "\nDownloading Images");

        const images = await getImages(source, searchQuery, amount);

        if (!images) return;

        for (let i = 0; i < images.length; i++) {
            coloredLog("normal", `Downloading image ${i + 1} of ${amount}`);
            coloredLog("debug", `Image URL: ${images[i].url}`);

            const buffer = await (await fetch(images[i].url)).buffer()

            coloredLog("normal", `Cropping image ${i + 1} of ${amount}`);
            await cropImage(buffer, process.cwd() + `/${folderPath}/${images[i].id}.jpg`);
        }

        coloredLog("success", `Downloaded ${amount} images for topic ${topic}`);
    }
}

async function cropImage(buffer: Buffer, path: string) {
    return new Promise((resolve, reject) => {
        sharp(buffer)
            .resize(config.videoSettings.width, config.videoSettings.height, {
                fit: 'cover',
                position: 'center'
            })
            .toFile(path, (err) => {
                if (err) reject(err);
                else resolve(true);
            })
    })
}


async function getVideos(source: ContentSource, searchQuery: string, amount: number) {
    switch (source) {
        case "pexels":
            return getPexelsVideos(searchQuery, amount);
        case "pixabay":
            return getPixabyVideos(searchQuery, amount);
        default:
            coloredLog("error", "Invalid source");
    }

    async function getPexelsVideos(searchQuery: string, amount: number): Promise<Array<{ url: string, id: string }> | undefined> {
        const url = `https://api.pexels.com/videos/search?query=${searchQuery.replace(/ /g, '+')}&per_page=${amount}`
        const response = await fetch(url, {
            headers: {
                Authorization: PEXELS_API_KEY || ""
            }
        });
        const data = await response.json();
        console.log(url)
        if (data.error) {
            coloredLog("error", `Failed to download videos: ${data.error.message}`);
            return;
        }

        let videoUrls = [] as Array<{ url: string, id: string }>;
        for (let i = 0; i < data.videos.length; i++) {
            const videoUrls = data.videos[i].video_files
            const bestVideo = videoUrls
                .filter((video: any) => video.link.includes(".com/video-files") && video.file_type === "video/mp4" && video.size < 50000000)
                .sort((a: any, b: any) => b.width * b.height - a.width * a.height)[0];

            if (!bestVideo) {
                coloredLog("error", `Failed to find a suitable video in video ${i} for topic ${searchQuery}`);
                continue;
            }

            videoUrls.push({ ulr: bestVideo.link, id: "" + data.videos[i].id });
        }
        return videoUrls;
    }

    async function getPixabyVideos(searchQuery: string, amount: number): Promise<Array<{ url: string, id: string }> | undefined> {
        const url = `https://pixabay.com/api/videos/?key=${PIXABAY_API_KEY}&q=${searchQuery.replace(/ /g, '+')}&per_page=${amount}`
        const response = await fetch(url);
        const data = await response.json();
        console.log(url)
        if (data.error) {
            coloredLog("error", `Failed to download videos: ${data.error.message}`);
            return;
        }

        let videoUrls = [] as Array<{ url: string, id: string }>;
        for (let i = 0; i < data.hits.length; i++) {
            const video = data.hits[i];
            if (video.videos.large.size === 0) {
                videoUrls.push(video.videos.medium.url);
            } else videoUrls.push({ url: video.videos.large.url, id: "" + video.id });
        }
        return videoUrls;
    }
}

export async function getImages(source: ContentSource, searchQuery: string, amount: number) {
    switch (source) {
        case "pexels":
            return getPexelsImages(searchQuery, amount);
        case "pixabay":
            return getPixabyImages(searchQuery, amount);
        default:
            coloredLog("error", "Invalid source");
    }

    async function getPexelsImages(searchQuery: string, amount: number): Promise<Array<{ url: string, id: string }> | undefined> {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${searchQuery.replace(/ /g, '+')}&per_page=${amount}`, {
            headers: {
                Authorization: PEXELS_API_KEY || ""
            }
        });
        const data = await response.json();
        if (data.error) {
            coloredLog("error", `Failed to download images: ${data.error.message}`);
            return;
        }

        let imageUrls = [] as Array<{ url: string, id: string }>;
        for (let i = 0; i < data.photos.length; i++) {
            const photo = data.photos[i];
            imageUrls.push({ url: photo.src.original, id: "" + photo.id });
        }
        return imageUrls;
    }

    async function getPixabyImages(searchQuery: string, amount: number): Promise<Array<{ url: string, id: string }> | undefined> {
        const response = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${searchQuery.replace(/ /g, '+')}&per_page=${amount}`);
        const data = await response.json();
        if (data.error) {
            coloredLog("error", `Failed to download images: ${data.error.message}`);
            return;
        }

        let imageUrls = [] as Array<{ url: string, id: string }>;
        for (let i = 0; i < data.hits.length; i++) {
            const image = data.hits[i];
            imageUrls.push({ url: image.largeImageURL, id: "" + image.id });
        }
        return imageUrls;
    }
}