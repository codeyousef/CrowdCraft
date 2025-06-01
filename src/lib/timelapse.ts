import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { Block } from '../types/game';

export class TimelapseGenerator {
  private ffmpeg: FFmpeg;
  private frames: string[] = [];
  private frameCount = 0;
  
  // Increase frame capture frequency for smoother timelapses
  private readonly CAPTURE_INTERVAL = 10000; // Capture every 10 seconds
  
  constructor() {
    this.ffmpeg = new FFmpeg();
  }
  
  async init() {
    await this.ffmpeg.load();
  }
  
  async captureFrame(blocks: Map<string, Block>, app: PIXI.Application, forceCapture = false) {
    // Only capture if enough time has passed or force capture is true
    if (!forceCapture && this.frameCount > 0) {
      const lastFrame = this.frames[this.frames.length - 1];
      const lastFrameTime = parseInt(lastFrame.split('_')[1] || '0');
      if (Date.now() - lastFrameTime < this.CAPTURE_INTERVAL) {
        return;
      }
    }
    
    // Extract canvas content as base64 PNG
    const base64 = app.view.toDataURL('image/png');
    this.frames.push(`frame_${Date.now()}_${base64}`);
    this.frameCount++;
    console.log(`📸 Captured frame ${this.frameCount}`);
  }
  
  async generateVideo(): Promise<Blob> {
    if (this.frames.length === 0) {
      throw new Error('No frames captured');
    }
    
    // Write frames to virtual filesystem
    for (let i = 0; i < this.frames.length; i++) {
      const base64 = this.frames[i].split('_')[2].split(',')[1];
      const buffer = Buffer.from(base64, 'base64');
      await this.ffmpeg.writeFile(`frame${i.toString().padStart(4, '0')}.png`, buffer);
    }
    
    // Generate video from frames
    await this.ffmpeg.exec([
      '-framerate', '60',
      '-pattern_type', 'sequence',
      '-i', 'frame%04d.png',
      '-c:v', 'libx264',
      '-preset', 'medium',
      '-crf', '23',
      '-pix_fmt', 'yuv420p',
      'output.mp4'
    ]);
    
    // Read the output file
    const data = await this.ffmpeg.readFile('output.mp4');
    return new Blob([data], { type: 'video/mp4' });
  }
  
  reset() {
    this.frames = [];
    this.frameCount = 0;
  }
}