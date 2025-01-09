import { Groq } from "groq-sdk";

import { coloredLog } from "./userInput.js";
import { ChatCompletionCreateParamsBase, ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions.js";

(await import('dotenv')).config();
const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
    coloredLog("error", "Please set the GROQ_API_KEY environment variable.");
    process.exit(1);
}

const groq = new Groq({apiKey: API_KEY});

export async function generateText(prompt: string, args?: Array<{name: string, value: string}>) {
    coloredLog("normal", "Generating text from prompt: ");
    coloredLog("debug", prompt);
    coloredLog("normal", "With arguments: ");
    coloredLog("debug", args?.map(arg => `${arg.name}: ${arg.value}`).join(", ") || "None");
    
    const messages = args ? args.map(arg => ({role: 'system', content: `${arg.name}: ${arg.value}`} as ChatCompletionMessageParam)) : [];
    messages.unshift({role: 'user', content: 'Prompt: ' + prompt} as ChatCompletionMessageParam);
    
    const groqResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 1.5,
    });

    return groqResponse.choices[0].message.content;
}