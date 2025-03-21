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
        height: number,
        maxSingleClipDuration: number,
        captions: {
            font: 
                | "andale mono"
                | "arial"
                | "avenir"
                | "avenir next"
                | "comic sans ms"
                | "courier new"
                | "georgia"
                | "helvetica"
                | "impact"
                | "open sans"
                | "quantify"
                | "tahoma"
                | "times new roman"
                | "trebuchet ms"
                | "verdana"
                | "webdings",
            fontSize: number,
            bold: boolean,
            fontColor: string,
            backgroundColor: string
        }
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

export const contentSources = ["pexels", "pixabay"] as const;
export type ContentSource = typeof contentSources[number];