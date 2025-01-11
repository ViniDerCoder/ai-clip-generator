import fetch from 'node-fetch';
import fs from 'fs';
import { createClient } from '@deepgram/sdk'

import { coloredLog } from '../utils/userInput.js';


(await import('dotenv')).config();
const API_KEY = process.env.DEEPGRAM_API_KEY;
if (!API_KEY) {
    coloredLog("error", "Please set the DEEPGRAM_API_KEY environment variable.");
    process.exit(1);
}

const deepgram = createClient(API_KEY);

export async function speechToText(audioPath: string, outputPath: string): Promise<void> {
    coloredLog("title", "\n\nConverting Speech to Text");

    if(!fs.existsSync(audioPath)) {
        coloredLog("error", `Audio file ${audioPath} not found.`);
        return
    }

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
        fs.readFileSync(audioPath),
        {
            model: 'nova-2',
            smart_format: true
        }
    );

    if (error) {
        coloredLog("error", `Failed to convert speech to text: ${error}`);
        return
    }

    const words = result.results.channels[0].alternatives.sort((a, b) => b.confidence - a.confidence)[0].words
    fs.writeFileSync(outputPath, JSON.stringify(words, null, 2));

    coloredLog("success", `Converted speech to text`);
    return
}