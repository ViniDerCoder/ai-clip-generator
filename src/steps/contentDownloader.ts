import fs from 'fs';
import fetch from 'node-fetch';
import sharp from 'sharp';

import { askMultipleChoiceQuestion, askQuestion, coloredLog } from '../utils/userInput.js';
import { promptFileSelection } from '../utils/promptFileSelection.js';
import { generateText } from '../utils/ai.js';
import { Config } from '../utils/types.js';

const config = JSON.parse(fs.readFileSync('config/config.json', 'utf-8')) as Config;


(await import('dotenv')).config();
const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
    coloredLog("error", "Please set the PEXELS_API_KEY environment variable.");
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

    if (type === 'Videos' || type === 'Both') {
        coloredLog("question", "\nDownloading Videos");

        const response = await fetch(`https://api.pexels.com/videos/search?query=${searchQuery}&per_page=${amount}`, {
            headers: {
                Authorization: API_KEY || ""
            }
        });
        const data = await response.json();
        if (data.error) {
            coloredLog("error", `Failed to download videos: ${data.error.message}`);
            return;
        }

        for (let i = 0; i < data.videos.length; i++) {
            const videoUrls = data.videos[i].video_files
            const bestVideo = videoUrls
                .filter((video: any) => video.link.includes(".com/video-files") && video.file_type === "video/mp4" && video.size < 50000000)
                .sort((a: any, b: any) => b.width * b.height - a.width * a.height)[0];

            if (!bestVideo) {
                coloredLog("error", `Failed to find a suitable video in video ${i}. for topic ${topic}`);
                continue;
            }

            coloredLog("normal", `Downloading video ${i + 1} of ${amount}`);
            coloredLog("debug", `Video URL: ${bestVideo.link}`);

            fs.writeFileSync(`${folderPath}/${bestVideo.id}.mp4`, await (await fetch(bestVideo.link)).buffer());
        }

        coloredLog("success", `Downloaded ${amount} videos for topic ${topic}`);
    }
    if (type === "Images" || type === "Both") {
        coloredLog("question", "\nDownloading Images");

        const response = await fetch(`https://api.pexels.com/v1/search?query=${topic}&per_page=${amount}`, {
            headers: {
                Authorization: API_KEY || ""
            }
        });
        const data = await response.json();
        if (data.error) {
            coloredLog("error", `Failed to download images: ${data.error.message}`);
            return;
        }

        for (let i = 0; i < data.photos.length; i++) {
            const photo = data.photos[i];
            coloredLog("normal", `Downloading image ${i + 1} of ${amount}`);
            coloredLog("debug", `Image URL: ${photo.src.original}`);

            fs.writeFileSync(`${folderPath}/${photo.id}-tmp.jpg`, await (await fetch(photo.src.original)).buffer());

            coloredLog("normal", `Cropping image ${i + 1} of ${amount}`);
            await cropImage(process.cwd() + `/${folderPath}/${photo.id}-tmp.jpg`);
        }

        coloredLog("success", `Downloaded ${amount} images for topic ${topic}`);
    }
}

async function cropImage(path: string) {
    return new Promise((resolve, reject) => {
        sharp(path)
            .resize(config.videoSettings.width, config.videoSettings.height, {
                fit: 'cover',
                position: 'center'
            })
            .toFile(path.replace('-tmp.jpg', '.jpg'), (err) => {
                if (err) reject(err);
                else resolve(true);
            });
    })
}