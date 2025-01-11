import fetch from 'node-fetch';
import fs from 'fs';

import { coloredLog } from '../utils/userInput.js';


export async function generateAudioForScript(script: string, outputPath: string) {
    coloredLog("title", "\n\nGenerating Audio");

    const chunks = splitString(script, 300);

    coloredLog("normal", `Split script into ${chunks.length} chunks`);

    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await textToSpeech(chunk, outputPath + `/chunk_${i}.mp3`);
        coloredLog("normal", `Generated audio for chunk ${i + 1} of ${chunks.length}`);
    }

    coloredLog("success", `Generated audio for script`);
    coloredLog("normal", `Stitching audio chunks together`);

    const audioChunks = chunks.map((_, i) => `${outputPath}/chunk_${i}.mp3`);
    await stitchAudioChunks(audioChunks, outputPath + "/final.mp3");
}

async function stitchAudioChunks(audioChunks: string[], outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const writeStream = fs.createWriteStream(outputPath);
        let currentChunk = 0

        function writeNextChunk() {
            if (currentChunk >= audioChunks.length) {
                writeStream.end();
                return;
            }
            const readStream = fs.createReadStream(audioChunks[currentChunk]);
            readStream.pipe(writeStream, { end: false });
            readStream.on('end', () => {
                currentChunk++;
                writeNextChunk();
            });
        }

        writeStream.on('close', () => {
            coloredLog("success", `Stitched audio chunks together`);
            resolve();
        });
        writeNextChunk();
    })
}

function splitString(str: string, chunkSize: number): string[] {
    const chunks: string[] = [];
    const words = str.trim().split(' ');
    words.forEach((word, index) => {
        if (index === 0) {
            chunks.push(word);
            return;
        }
        const lastChunk = chunks[chunks.length - 1];
        if (lastChunk.length + word.length + 1 <= chunkSize) {
            chunks[chunks.length - 1] = `${lastChunk} ${word}`;
        } else {
            chunks.push(word);
        }
    });
    return chunks;
}

async function textToSpeech(text: string, outputPath: string) {
    const url = "https://tiktok-tts.weilnet.workers.dev/api/generation"
    const headers = {
        'Content-Type': 'application/json'
    }
    const data = {
        text: text,
        voice: "en_us_009"
    }

    await (await fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(data)
    })).json().then((response) => {
        const audio = response.data
        fs.writeFileSync(outputPath, Buffer.from(audio, 'base64'))
    })
}