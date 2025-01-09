import fs from 'fs';
import fetch from 'node-fetch';

import { coloredLog } from '../utils/userInput.js';


(await import('dotenv')).config();
const API_KEY = process.env.PEXELS_API_KEY;
if (!API_KEY) {
    coloredLog("error", "Please set the PEXELS_API_KEY environment variable.");
    process.exit(1);
}


export async function downloadContent(topic: string, amount: number, folderPath: string) {
    coloredLog("title", "\n\nDownloading Content");

    const response = await fetch(`https://api.pexels.com/videos/search?query=${topic}&per_page=${amount}`, {
        headers: {
            Authorization: API_KEY || ""
        }
    });
    const data = await response.json();
    if(data.error) {
        coloredLog("error", `Failed to download content: ${data.error.message}`);
        return;
    }

    for (let i = 0; i < data.videos.length; i++) {
        const videoUrls = data.videos[i].video_files
        const bestVideo = videoUrls
            .filter((video: any) => video.link.includes(".com/video-files") && video.file_type === "video/mp4" && video.size < 50000000)
            .sort((a: any, b: any) => b.width*b.height - a.width*a.height)[0];

        if (!bestVideo) {
            coloredLog("error", `Failed to find a suitable video in video ${i}. for topic ${topic}`);
            continue;
        }
        
        coloredLog("normal", `Downloading video ${i+1} of ${amount}`);
        coloredLog("debug", `Video URL: ${bestVideo.link}`);

        fs.writeFileSync(`${folderPath}/${bestVideo.id}.mp4`, await (await fetch(bestVideo.link)).buffer()); 
    }

    coloredLog("success", `Downloaded ${amount} videos for topic ${topic}`);
}