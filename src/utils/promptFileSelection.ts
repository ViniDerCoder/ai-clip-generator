import fs from 'fs';

import { coloredLog, askMultipleChoiceQuestion } from './userInput.js';

export async function promptFileSelection(promptFileFolder: string, defaultPrompt: string, automaticMode: boolean) {
    const availablePrompts = fs.readdirSync('config/prompts/'+ promptFileFolder, 'utf-8');
    if (availablePrompts.length === 0) {
        coloredLog("error", 'No prompt-files available in the ' + promptFileFolder + ' folder.');
        process.exit(1);
    }
    

    if (!availablePrompts.includes(defaultPrompt)) {
        coloredLog("error", `The default prompt-file ${defaultPrompt} is not available. Please set a new default prompt in the config file.`);
        if (automaticMode) coloredLog("warn", `Using the first available prompt-file.`);
    }

    const prompt = automaticMode ? (availablePrompts.includes(defaultPrompt) ? defaultPrompt : availablePrompts[0]) : (await askMultipleChoiceQuestion('Select a prompt-file', availablePrompts, availablePrompts.includes(defaultPrompt) ? defaultPrompt : undefined));
    if (!prompt) {
        coloredLog("error", 'Prompt selection failed.');
        return await promptFileSelection(promptFileFolder, defaultPrompt, automaticMode);
    }

    const promptContent = fs.readFileSync(`config/prompts/${promptFileFolder}/${prompt}`, 'utf-8');
    if (!promptContent) {
        coloredLog("error", `Failed to read the content of the prompt-file ${prompt}.`);
        return await promptFileSelection(promptFileFolder, defaultPrompt, automaticMode);
    }

    return promptContent;
}