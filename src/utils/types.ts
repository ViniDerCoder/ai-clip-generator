export type Config = {
    automaticMode: boolean,
    defaults: {
        prompts: {
            topicGenerationPrompt: string,
            infoTextGenerationPrompt: string,
            searchQueryGenerationPrompt: string
        }
    },
    videoSettings: {
        width: number,
        height: number
    }
}

export type SubtitleWord = {
    start: number,
    end: number,
    word: string,
    punctuated_word: string
    confidence: number
}

export type Subtitle = Array<SubtitleWord>