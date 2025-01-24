import { askQuestion, coloredLog } from '../utils/userInput.js';
import { askMultipleChoiceQuestion } from '../utils/userInput.js';
import { generateText } from '../utils/ai.js';
import { config, automaticMode } from '../index.js';
import { promptFileSelection } from '../utils/promptFileSelection.js';


export async function generateScriptForTopic(topic: string) {
    coloredLog("title", "\n\nGenerating Script");

    const promptContent = await promptFileSelection('infoTextGeneration', config.defaults.prompts.infoTextGenerationPrompt, automaticMode);

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