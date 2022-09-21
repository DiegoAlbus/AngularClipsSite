import { Injectable } from '@angular/core';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

@Injectable({
  providedIn: 'root'
})
export class FfmpegService {
  isReady = false;
  private ffmpeg;
  isRunning = false;

  constructor() {
    this.ffmpeg = createFFmpeg( {log: true});
  }

  async init() {
    if (this.isReady) {
      return;
    }

    await this.ffmpeg.load();

    this.isReady = true;
  }

  // source https://www.ffmpeg.org/

  async getScreenshot(file: File){
    this.isRunning = true;
    const data = await fetchFile(file);
    
    this.ffmpeg.FS('writeFile', file.name, data);

    const seconds = [1,2,3];
    const commands: string[] = [];

    seconds.forEach(second => {
      commands.push(
        // Input
        '-i', file.name,
        //Output Options
        '-ss', `00:00:0${second}`, // timestamp
        '-frames:v', '1', // 1 frame for the screenshot
        '-filter:v', 'scale=510:-1', // Frame size, the -1 ffmpeg will calculate the aspect ratio for the width
        //Output
        `output_0${second}.png`
      );
    });

    await this.ffmpeg.run(
      ...commands
    );

    const screenshots : string[] = [];

    seconds.forEach(second => {
      const screenshotFile = this.ffmpeg.FS('readFile', `output_0${second}.png`);
      const screenshotBlob = new Blob(
        [screenshotFile.buffer], {
          type: 'image/png'
        }
      );
      
      const screenshotURL = URL.createObjectURL(screenshotBlob);

      screenshots.push(screenshotURL);
    });

    this.isRunning = false;
    
    return screenshots;

  }

  async blobFromURL(url : string){
    const response = await fetch(url);
    const blob = await response.blob();

    return blob;
  }
}
