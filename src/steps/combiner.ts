import FFCreator from 'ffcreator';
import mp3Duration from '@rocka/mp3-duration';
import { getVideoDurationInSeconds } from 'get-video-duration';
import getTextWidth from 'string-pixel-width';
import fs from 'fs';

import { askContinueQuestion, askYesNoQuestion, coloredLog, newProgressBar, updateProgressBar } from '../utils/userInput.js';
import { Config, Subtitle, SubtitleWord } from '../utils/types.js';
import { generateCaptionsTextBox } from '../utils/styling.js';

const config = JSON.parse(fs.readFileSync('config/config.json', 'utf-8')) as Config;
const { width, height, maxSingleClipDuration, captions  } = config.videoSettings;

export async function createVideo(outputPath: string, contentPaths: string[], titlePath: string, audioPath: string, transcriptPath: string): Promise<undefined> {
    const promise = new Promise<undefined>(async (resolve, reject) => {

        coloredLog("warn", `\nBefore starting the video processing, check the content folder of this clip. \nDelete images/videos which aren't matching the topic and add new content if necessary. \nThe images/videos are used in the video in their alphabetical order of their file name.\n`
        );

        if(!await askYesNoQuestion('Start video processing?', true)) return createVideo(outputPath, contentPaths, titlePath, audioPath, transcriptPath);

        coloredLog('title', '\nStarting video processing');

        const creator = new FFCreator.FFCreator({
            cacheDir: './temp/',
            outputDir: outputPath,
            width,
            height
        });

        const audioLength = await mp3Duration(fs.readFileSync(audioPath));
        let usedLength = 0
        creator.setDuration(audioLength + 1);

        const scene = new FFCreator.FFScene();
        scene.setBgColor("#000000");
        scene.setDuration(audioLength + 1);
        scene.setTransition("none", 0);

        if(!contentPaths[0]) {
            coloredLog("error", "No content found. Please download content first.");
            return createVideo(outputPath, contentPaths, titlePath, audioPath, transcriptPath);
        }

        const genScene = async (i: number) => {
            coloredLog('debug', (i + 1) + '. content file: ' + contentPaths[i]);
            const duration = await addToScene(contentPaths[i], scene, usedLength, audioLength + 1)
            usedLength += duration < maxSingleClipDuration ? duration : maxSingleClipDuration;
            if (i < contentPaths.length - 1) await genScene(i + 1)
        }
        await genScene(0)

        const subtitles = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8')) as Subtitle;
        const fontSize = 70

        subtitles.forEach((subtitle: SubtitleWord, i: number) => {
            const imageBuffer = generateCaptionsTextBox(subtitle.punctuated_word, captions);
            fs.writeFileSync('./temp/textbox-' + i + '.png', imageBuffer);
            const image = new FFCreator.FFImage({ path: './temp/textbox-' + i + '.png', x: width / 2, y: height - 450});

            image.setDuration(subtitle.end - subtitle.start);
            image.addEffect("fadeIn", 0.01, subtitle.start);
            image.addEffect("fadeOut", 0.01, subtitle.end - 0.01);

            scene.addChild(image);
        })

        creator.addChild(scene);

        const audio = new FFCreator.FFAudio({ path: audioPath });
        creator.addAudio(audio);

        //Start processing
        const oldVersions = fs.readdirSync(outputPath).filter(file => file.startsWith('version')).length;
        creator.output(outputPath + '/version_' + (oldVersions + 1) + '.mp4');
        creator.start();


        newProgressBar('Generating video');
        let startTimeStamp = Date.now();

        creator.on('progress', (progress) => {
            updateProgressBar('Generating video', progress.percent * 100, 'Processing... [' + (Date.now() - startTimeStamp) + 'ms]');
        });

        creator.on('complete', (completion) => {
            updateProgressBar('Generating video', 100, 'Completed [' + (Date.now() - startTimeStamp) + 'ms]');
            resolve(undefined);
        });

        creator.on('error', (err) => {
            updateProgressBar('Generating video', undefined, 'Error [' + (Date.now() - startTimeStamp) + 'ms]', true);
            coloredLog('error', 'Error while generating video: ' + err.error);
            console.log(err);
            resolve(undefined);
        });
    })

    return promise
}

async function addToScene(contentPath: string, scene: FFCreator.FFScene, usedLength: number, maxLength: number): Promise<number> {
    if (usedLength >= maxLength) return 0;
    let duration = contentPath.endsWith('.mp4') ? await getVideoDurationInSeconds(contentPath) : 7;
    if (usedLength + duration > maxLength) {
        duration = maxLength - usedLength;
    }

    if (contentPath.endsWith('.mp4')) {
        const video = new FFCreator.FFVideo({ path: contentPath, x: width / 2, y: height / 2, width, height });
        
        if (duration > maxSingleClipDuration) video.setDuration(maxSingleClipDuration);
        video.setAudio(false)
        video.addEffect("fadeIn", 0.5, usedLength);

        console.log("Adding video ", contentPath, " to scene, duration: ", duration < maxSingleClipDuration ? duration : maxSingleClipDuration, " usedLength: ", usedLength)
        scene.addChild(video);
    } else {
        const image = new FFCreator.FFImage({ path: contentPath, x: width / 2, y: height / 2, width, height });

        image.setDuration(duration);
        image.addEffect("fadeIn", 0.5, usedLength);
        image.addEffect("zoomingIn", duration, usedLength);

        console.log("Adding image ", contentPath, " to scene, duration: ", duration, " usedLength: ", usedLength)
        scene.addChild(image);
    }

    return duration
}