export type Config = {
    automaticMode: boolean,
    defaults: {
        prompts: {
            topicGenerationPrompt: string,
            infoTextGenerationPrompt: string
        }
    }
}