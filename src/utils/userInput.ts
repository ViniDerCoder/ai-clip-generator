import readline from 'readline';

const errorColor = '\x1b[1m\x1b[31m';
const warningColor = '\x1b[33m';
const successColor = '\x1b[1m\x1b[32m';
const debugColor = '\x1b[90m';
const questionColor = '\x1b[34m';
const defaultValueColor = '\x1b[1m\x1b[96m';
const valueSelectionColor = '\x1b[90m';
const titleColor = '\x1b[1m\x1b[35m';
const resetColor = '\x1b[0m';


export const askQuestion = (question: string, defaultValue?: string): Promise<string | undefined> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(questionColor + question + resetColor + ": ", (answer) => {
            rl.close();
            resolve(answer || defaultValue);
        });

        if (defaultValue) {
            rl.write(defaultValue);
        }
    });
};

export const askYesNoQuestion = async (question: string, defaultValue?: boolean, stripDefaultValues?: boolean): Promise<boolean | undefined> => {
    const answer = await askQuestion(`${questionColor}${question} ${valueSelectionColor}${!stripDefaultValues ? `(${defaultValue === true ? defaultValueColor : ""}yes${valueSelectionColor}/${defaultValue === false ? defaultValueColor : ""}no${valueSelectionColor})` : ""}${resetColor}`);
    return answer ? answer.toLowerCase().startsWith('y') : defaultValue;
}

export const askMultipleChoiceQuestion = async (question: string, choices: string[], defaultValue?: string): Promise<string | undefined> => {
    console.log("")
    const answer = await askQuestion(`${choices.map((choice, index) => `${defaultValue === choice ? defaultValueColor : valueSelectionColor}${index + 1}${valueSelectionColor}:    ${choice}`).join('\n')}${resetColor}\n${questionColor}${question}${resetColor}`);
    return answer ? choices[parseInt(answer) - 1] : defaultValue;
}

export const askNumberQuestion = async (question: string, defaultValue?: number): Promise<number | undefined> => {
    const answer = await askQuestion(`${questionColor}${question}${resetColor}${defaultValue ? ` ${valueSelectionColor}(${defaultValueColor}${defaultValue}${valueSelectionColor})${resetColor}` : ""}`);
    return answer ? (isNaN(parseInt(answer)) ? undefined : parseInt(answer)) : defaultValue;
}

export const askContinueQuestion = async (question: string): Promise<boolean> => {
    return await askYesNoQuestion(question, true, true) || false;
}

export const newProgressBar = (name: string) => {
    console.log(`${titleColor}${name}${resetColor}: `);
    updateProgressBar(name, 0, "Starting...");
};

let lastProgressBarProgress = 0;
export const updateProgressBar = (name: string, progress?: number, info: string = "", error: boolean = false) => {
    if (!progress) progress = lastProgressBarProgress;
    lastProgressBarProgress = progress;

    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(`${questionColor}${name}: ${(error ? errorColor : resetColor) + drawProgressBar(progress)} ${debugColor}${info}${resetColor}`);
};

const drawProgressBar = (progress: number) => {
    const barWidth = 30;
    const filledWidth = Math.floor(progress / 100 * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const progressBar = '█'.repeat(filledWidth) + '▒'.repeat(emptyWidth);
    return `${progress === 100 ? successColor : resetColor}[${progressBar}] ${Math.round(progress * 10) / 10}%`;
}

export const coloredLog = (color: "error" | "normal" | "question" | "defaultValue" | "valueSelection" | "warn" | "debug" | "success" | "title", message: string) => {
    switch (color) {
        case "error":
            console.log(`${errorColor}${message}${resetColor}`);
            break;
        case "warn":
            console.log(`${warningColor}${message}${resetColor}`);
            break;
        case "success":
            console.log(`${successColor}${message}${resetColor}`);
            break;
        case "debug":
            console.log(`${debugColor}${message}${resetColor}`);
            break;
        case "question":
            console.log(`${questionColor}${message}${resetColor}`);
            break;
        case "defaultValue":
            console.log(`${defaultValueColor}${message}${resetColor}`);
            break;
        case "valueSelection":
            console.log(`${valueSelectionColor}${message}${resetColor}`);
            break;
        case "title":
            console.log(`${titleColor}${message}${resetColor}`);
            break;
        default:
            console.log(message);
    }
}