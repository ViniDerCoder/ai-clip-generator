import fs from 'fs';

import { askQuestion, coloredLog } from '../utils/userInput.js';
import { askMultipleChoiceQuestion } from '../utils/userInput.js';
import { generateText } from '../utils/ai.js';
import { config, automaticMode } from '../index.js';


export async function generateScriptForTopic(topic: string) {
    coloredLog("title", "\n\nGenerating Script");
    const availablePrompts = fs.readdirSync('config/prompts/infoTextGeneration', 'utf-8');
    if (availablePrompts.length === 0) {
        coloredLog("error", 'No prompt-files available in the infoTextGeneration folder.');
        process.exit(1);
    }

    const defaultPrompt = config.defaults.prompts.infoTextGenerationPrompt;

    if (!availablePrompts.includes(defaultPrompt)) {
        coloredLog("error", `The default prompt-file ${defaultPrompt} is not available. Please set a new default prompt in the config file.`);
        if (automaticMode) coloredLog("warn", `Using the first available prompt-file.`);
    }

    const prompt = automaticMode ? (availablePrompts.includes(defaultPrompt) ? defaultPrompt : availablePrompts[0]) : (await askMultipleChoiceQuestion('Select a prompt-file', availablePrompts, availablePrompts.includes(defaultPrompt) ? defaultPrompt : undefined));
    if (!prompt) {
        coloredLog("error", 'Prompt selection failed.');
        return await generateScriptForTopic(topic);
    }

    const promptContent = fs.readFileSync(`config/prompts/infoTextGeneration/${prompt}`, 'utf-8');
    if (!promptContent) {
        coloredLog("error", `Failed to read the content of the prompt-file ${prompt}.`);
        return await generateScriptForTopic(topic);
    }

    const script = await generateText(promptContent, [{ name: 'topic', value: topic }]);
    if (!script) {
        coloredLog("error", 'Failed to generate script.');
        return await generateScriptForTopic(topic);
    }

    coloredLog("normal", `Generated script: ${script}`);

    const confirm = await askMultipleChoiceQuestion(`Generated script above. Select an action`, ['Use Script', 'Edit Script', 'Regenerate Script'], 'Use Script');
    if (confirm === 'Edit Script') {
        return await askQuestion('Edit Script', script);
    } else if (confirm === 'Regenerate Script') {
        return await generateScriptForTopic(topic);
    }

    return script;
}