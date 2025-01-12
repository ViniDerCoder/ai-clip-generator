import fs from 'fs';

import { askMultipleChoiceQuestion, askQuestion, coloredLog } from "../utils/userInput.js";
import { config, automaticMode } from '../index.js';
import { generateText } from '../utils/ai.js';


export async function getTopic(generate: boolean) {
    coloredLog("title", "\n\nGenerating Topic");
    if (generate) {
        //Generate topic
        const topic = await generateTopic();
        return topic || undefined;
    } else {
        //Ask for topic
        const topic = await askQuestion('Enter a topic');
        return topic;
    }
}

async function generateTopic() {
    const availablePrompts = fs.readdirSync('config/prompts/topicGeneration', 'utf-8');
    if (availablePrompts.length === 0) {
        coloredLog("error", 'No prompt-files available in the topicGeneration folder.');
        process.exit(1);
    }

    const defaultPrompt = config.defaults.prompts.topicGenerationPrompt;

    if(!availablePrompts.includes(defaultPrompt)) {
        coloredLog("error", `The default prompt-file ${defaultPrompt} is not available. Please set a new default prompt in the config file.`);
        if(automaticMode) coloredLog("warn", `Using the first available prompt-file.`);
    }

    const prompt = automaticMode ? (availablePrompts.includes(defaultPrompt) ? defaultPrompt : availablePrompts[0]) : (await askMultipleChoiceQuestion('Select a prompt-file', availablePrompts, availablePrompts.includes(defaultPrompt) ? defaultPrompt : undefined));
    if(!prompt) {
        coloredLog("error", 'Prompt selection failed.');
        return await generateTopic();
    }

    const promptContent = fs.readFileSync(`config/prompts/topicGeneration/${prompt}`, 'utf-8');
    if(!promptContent) {
        coloredLog("error", `Failed to read the content of the prompt-file ${prompt}.`);
        return await generateTopic();
    }

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