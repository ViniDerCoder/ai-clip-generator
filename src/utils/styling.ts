import { createCanvas } from "canvas";
import getTextWidth from 'string-pixel-width';

import { Config } from "./types.js";

export function generateCaptionsTextBox(text: string, captionsConfig: Config["videoSettings"]["captions"]): Buffer {
    const widthOfText = getTextWidth(text, { bold: captionsConfig.bold, font: captionsConfig.font, size: captionsConfig.fontSize });
    const padding = 20
    const canvasWidth = widthOfText + padding * 2;
    const canvasHeight = 100;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");


    ctx.fillStyle = captionsConfig.backgroundColor;
    ctx.beginPath();
    ctx.arc(padding, padding, padding, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(padding, canvasHeight - padding, padding, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvasWidth - padding, padding, padding, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(canvasWidth - padding, canvasHeight - padding, padding, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillRect(padding, 0, canvasWidth - padding * 2, canvasHeight);
    ctx.fillRect(0, padding, canvasWidth, canvasHeight - padding * 2);


    ctx.font = `${captionsConfig.bold ? "bold " : ""}${captionsConfig.fontSize}px ${captionsConfig.font}`;
    ctx.fillStyle = captionsConfig.fontColor;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2);

    return canvas.toBuffer();
}