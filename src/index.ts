import fs from 'fs';

import { Config } from './utils/types.js';
import { askNumberQuestion, askQuestion, askYesNoQuestion } from './utils/userInput.js';
import { getTopic } from './steps/topicSelection.js';

//Initialize
await import('./utils/ai.js');

export const config = JSON.parse(fs.readFileSync('config/config.json', 'utf-8')) as Config;
export const automaticMode = config.automaticMode;


//Ask for session specific settings
const generateTopicsInAutomaticMode = await askYesNoQuestion('Do you want to generate topics automatically?', false) || false;
const amountOfClipsToGenerate = (generateTopicsInAutomaticMode && automaticMode) ? ((await askNumberQuestion('How many clips do you want to generate?', 1)) || 1) : 1;


async function generateClip() {
    //Generate topic
    const topic = await getTopic(generateTopicsInAutomaticMode);
    console.log(topic);
}

for (let i = 0; i < amountOfClipsToGenerate; i++) {
    await generateClip();
}