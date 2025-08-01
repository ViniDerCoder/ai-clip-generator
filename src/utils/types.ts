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
            font: CaptionFont,
            fontSize: number,
            bold: boolean,
            fontColor: string
            backgroundColor: string
        }
    }
}

export const validCaptionFonts = [
    "andale mono",
    "arial",
    "avenir",
    "avenir next",
    "comic sans ms",
    "courier new",
    "georgia",
    "helvetica",
    "impact",
    "open sans",
    "quantify",
    "tahoma",
    "times new roman",
    "trebuchet ms",
    "verdana",
    "webdings"
] as const;
export type CaptionFont = typeof validCaptionFonts[number];

export type SubtitleWord = {
    start: number,
    end: number,
    word: string,
    punctuated_word: string
    confidence: number
}

export type Subtitle = Array<SubtitleWord>

export const validContentSources = ["pexels", "pixabay"] as const;
export type ContentSource = typeof validContentSources[number];