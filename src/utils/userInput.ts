import readline from 'readline';

const errorColor = '\x1b[31m';
const warningColor = '\x1b[33m';
const questionColor = '\x1b[32m';
const defaultValueColor = '\x1b[36m';
const valueSelectionColor = '\x1b[90m';
const resetColor = '\x1b[0m';


export const askQuestion = (question: string, defaultValue?: string): Promise<string | undefined> => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer || defaultValue);
        });
    });
};

export const askYesNoQuestion = async (question: string, defaultValue?: boolean): Promise<boolean | undefined> => {
    const answer = await askQuestion(`${questionColor}${question} ${valueSelectionColor}(${defaultValue === true ? defaultValueColor : ""}yes${valueSelectionColor}/${defaultValue === false ? defaultValueColor : ""}no${valueSelectionColor})${resetColor}: `);
    return answer ? answer.toLowerCase().startsWith('y') : defaultValue;
}

export const askMultipleChoiceQuestion = async (question: string, choices: string[], defaultValue?: string): Promise<string | undefined> => {
    console.log("")
    const answer = await askQuestion(`${choices.map((choice, index) => `${defaultValue === choice ? defaultValueColor : ""}${index + 1}${valueSelectionColor}:    ${choice}`).join('\n')}${resetColor}\n${questionColor}${question}${resetColor}: `);
    return answer ? choices[parseInt(answer) - 1] : defaultValue;
}

export const askNumberQuestion = async (question: string, defaultValue?: number): Promise<number | undefined> => {
    const answer = await askQuestion(`${questionColor}${question}${resetColor}${defaultValue ? ` ${valueSelectionColor}(${defaultValueColor}${defaultValue}${valueSelectionColor})${resetColor}` : ""}: `);
    return answer ? (isNaN(parseInt(answer)) ? undefined : parseInt(answer)) : defaultValue;
}

export const coloredLog = (color: "error" | "normal" | "question" | "defaultValue" | "valueSelection" | "warn", message: string) => {
    switch (color) {
        case "error":
            console.log(`${errorColor}${message}${resetColor}`);
            break;
        case "warn":
            console.log(`${warningColor}${message}${resetColor}`);
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
        default:
            console.log(message);
    }
}