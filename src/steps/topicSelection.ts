import fs from 'fs';

import { askMultipleChoiceQuestion, askQuestion, coloredLog } from "../utils/userInput.js";
import { config, automaticMode } from '../index.js';
import { generateText } from '../utils/ai.js';
import { promptFileSelection } from '../utils/promptFileSelection.js';


export async function getTopic(generate: boolean) {
    if (generate) {
        coloredLog("title", "\n\nGenerating Topic");
        //Generate topic
        const topic = await generateTopic();
        return topic || undefined;
    } else {
        coloredLog("title", "\n\nSelecting Topic");
        //Ask for topic
        const topic = await askQuestion('Enter a topic');
        return topic;
    }
}

async function generateTopic() {
    const promptContent = await promptFileSelection('topicGeneration', config.defaults.prompts.topicGenerationPrompt, automaticMode);

    const topic = await generateText(promptContent);
    if(!topic) {
        coloredLog("error", 'Failed to generate topic.');
        return await generateTopic();
    }

    coloredLog("normal", `Generated topic: ${topic}`);

    const confirm = await askMultipleChoiceQuestion(`Generated topic: ${topic}. Select an action`, ['Use Topic', 'Edit Topic', 'Regenerate Topic'], 'Use Topic');
    if(confirm === 'Edit Topic') {
        return await askQuestion('Edit topic', topic);
    } else if(confirm === 'Regenerate Topic') {
        return await generateTopic();
    }

    return topic;
}