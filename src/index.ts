import fs from 'fs';

import { Config } from './utils/types.js';
import { askNumberQuestion, askQuestion, askYesNoQuestion, coloredLog } from './utils/userInput.js';
import { getTopic } from './steps/topicSelection.js';
import { generateScriptForTopic } from './steps/scriptGenerator.js';
import { downloadContent } from './steps/contentDownloader.js';
import { generateAudioForScript } from './steps/textToSpeech.js';
import { speechToText } from './steps/speechToText.js';

//Initialize
await import('./utils/ai.js');
await import('./steps/textToSpeech.js')
await import('./steps/speechToText.js')
await import('./steps/contentDownloader.js')

export const config = JSON.parse(fs.readFileSync('config/config.json', 'utf-8')) as Config;
export const automaticMode = config.automaticMode;


//Ask for session specific settings
const generateTopicsInAutomaticMode = await askYesNoQuestion('\nDo you want to generate topics automatically?', false) || false;
const amountOfClipsToGenerate = (generateTopicsInAutomaticMode && automaticMode) ? ((await askNumberQuestion('How many clips do you want to generate?', 1)) || 1) : 1;


async function generateClip() {
    //Generate topic
    const topic = await getTopic(generateTopicsInAutomaticMode);
    if(!topic) {
        coloredLog("error", 'Topic generation failed.');
        return await generateClip();
    }
    else coloredLog("success", `Generated topic: ${topic}\n`);

    //Create Folder for Clip Files
    if (!fs.existsSync('clips')) fs.mkdirSync('clips');
    const folderName = topic.replace(/ /g, '_') + '_clip_' + new Date().getTime()
    fs.mkdirSync('clips/' + folderName);

    fs.writeFileSync('clips/' + folderName + '/topic.txt', topic);  

    //Generate script
    const script = await generateScriptForTopic(topic);
    if(!script) {
        coloredLog("error", 'Script generation failed.');
        return await generateClip();
    }
    else coloredLog("success", `Generated script: ${script}\n`);
    fs.writeFileSync('clips/' + folderName + '/script.txt', script);

    //Download content
    fs.mkdirSync('clips/' + folderName + '/content');
    await downloadContent(topic, 5, "clips/" + folderName + "/content");

    //Text to Speech
    fs.mkdirSync('clips/' + folderName + '/audio');
    await generateAudioForScript(script, 'clips/' + folderName + '/audio');

    //Speech to Text
    await speechToText('clips/' + folderName + '/audio/final.mp3', 'clips/' + folderName + '/transcript.json');
}

for (let i = 0; i < amountOfClipsToGenerate; i++) {
    await generateClip()
}