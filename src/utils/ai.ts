import { Groq } from "groq-sdk";

import { coloredLog } from "./userInput.js";

(await import('dotenv')).config();
const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
    coloredLog("error", "Please set the GROQ_API_KEY environment variable.");
    process.exit(1);
}

const groq = new Groq({apiKey: API_KEY});

export async function generateText(prompt: string) {
    const groqResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    });

    return groqResponse.choices[0].message.content;
}