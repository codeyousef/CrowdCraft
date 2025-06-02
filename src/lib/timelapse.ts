import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { Block } from '../types/game';

export class TimelapseGenerator {
  private ffmpeg: FFmpeg;
  private frames: string[] = [];
  private frameCount = 0;
  private isLoaded = false;
  private isLoading = false;
  
  // Capture every 30 seconds for good balance of detail vs performance
  private readonly CAPTURE_INTERVAL = 30000;
  
  constructor() {
    this.ffmpeg = new FFmpeg();
    
    // Add logging to see what's happening
    this.ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg:', message);
    });
    
    this.ffmpeg.on('progress', ({ progress }) => {
      console.log(`🎬 FFmpeg progress: ${Math.round(progress * 100)}%`);
    });
  }
  
  async init(): Promise<boolean> {
    if (this.isLoaded) {
      console.log('✅ FFmpeg already loaded');
      return true;
    }
    
    if (this.isLoading) {
      console.log('⏳ FFmpeg is already loading, waiting...');
      // Wait for loading to complete
      while (this.isLoading && !this.isLoaded) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return this.isLoaded;
    }
    
    // For development/testing, skip FFmpeg loading and use mock mode
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode: Using mock FFmpeg for testing');
      this.isLoaded = true;
      return true;
    }
    
    try {
      this.isLoading = true;
      console.log('🔄 Loading FFmpeg...');
      
      // Load FFmpeg with CDN URLs for better reliability
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      
      this.isLoaded = true;
      this.isLoading = false;
      console.log('✅ FFmpeg loaded successfully');
      return true;
      
    } catch (error) {
      this.isLoading = false;
      console.error('❌ Failed to load FFmpeg:', error);
      
      // Try fallback without toBlobURL
      try {
        console.log('🔄 Trying FFmpeg fallback method...');
        await this.ffmpeg.load();
        this.isLoaded = true;
        console.log('✅ FFmpeg loaded with fallback method');
        return true;
      } catch (fallbackError) {
        console.error('❌ FFmpeg fallback also failed:', fallbackError);
        return false;
      }
    }
  }
  
  async captureFrame(blocks: Map<string, Block>, app: PIXI.Application, forceCapture = false): Promise<boolean> {
    try {
      // Only capture if enough time has passed or force capture is true
      if (!forceCapture && this.frameCount > 0) {
        const lastFrame = this.frames[this.frames.length - 1];
        const lastFrameTime = parseInt(lastFrame.split('_')[1] || '0');
        if (Date.now() - lastFrameTime < this.CAPTURE_INTERVAL) {
          return false;
        }
      }
      
      // Check if app and canvas are available
      if (!app?.view || typeof app.view.toDataURL !== 'function') {
        console.warn('⚠️ Cannot capture frame: app or canvas not available, creating placeholder frame');
        // Create a placeholder frame for testing
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, 640, 480);
        ctx.fillStyle = '#6366F1';
        ctx.font = '24px Arial';
        ctx.fillText(`Frame ${this.frameCount + 1} - ${blocks.size} blocks`, 20, 50);
        const base64 = canvas.toDataURL('image/png');
        
        this.frames.push(`frame_${Date.now()}_${base64}`);
        this.frameCount++;
        console.log(`📸 Captured placeholder frame ${this.frameCount} (${blocks.size} blocks)`);
        return true;
      }
      
      // Extract canvas content as base64 PNG  
      const canvas = app.view as HTMLCanvasElement;
      const base64 = canvas.toDataURL('image/png');
      
      if (!base64 || base64 === 'data:,') {
        console.warn('⚠️ Cannot capture frame: empty canvas data');
        return false;
      }
      
      this.frames.push(`frame_${Date.now()}_${base64}`);
      this.frameCount++;
      console.log(`📸 Captured frame ${this.frameCount} (${blocks.size} blocks)`);
      return true;
      
    } catch (error) {
      console.error('❌ Failed to capture frame:', error);
      return false;
    }
  }
  
  async generateVideo(): Promise<Blob> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg not loaded');
    }
    
    if (this.frames.length === 0) {
      throw new Error('No frames captured for timelapse');
    }
    
    console.log(`🎬 Generating video from ${this.frames.length} frames...`);
    
    // For development mode, create a mock video blob
    if (process.env.NODE_ENV === 'development') {
      console.log('🧪 Development mode: Creating mock video blob');
      
      // Create a simple mock video content (empty MP4 header)
      const mockVideoData = new Uint8Array([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
        0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
        0x6d, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08, 0x66, 0x72, 0x65, 0x65
      ]);
      
      const mockBlob = new Blob([mockVideoData], { type: 'video/mp4' });
      console.log(`✅ Mock video generated: ${mockBlob.size} bytes (${this.frames.length} frames)`);
      return mockBlob;
    }
    
    try {
      // Write frames to virtual filesystem
      for (let i = 0; i < this.frames.length; i++) {
        const frameData = this.frames[i];
        const base64Data = frameData.split('_')[2];
        
        if (!base64Data || !base64Data.includes(',')) {
          console.warn(`⚠️ Skipping invalid frame ${i}`);
          continue;
        }
        
        // Remove data URL prefix
        const cleanBase64 = base64Data.split(',')[1];
        
        // Convert base64 to Uint8Array
        const binaryString = atob(cleanBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }
        
        const filename = `frame${i.toString().padStart(4, '0')}.png`;
        await this.ffmpeg.writeFile(filename, bytes);
        console.log(`✅ Wrote frame ${i + 1}/${this.frames.length}`);
      }
      
      console.log('🎬 Starting video encoding...');
      
      // Generate video from frames with optimized settings
      await this.ffmpeg.exec([
        '-framerate', '2', // 2 FPS for smooth but not too fast timelapse
        '-pattern_type', 'sequence',
        '-i', 'frame%04d.png',
        '-c:v', 'libx264',
        '-preset', 'ultrafast', // Faster encoding
        '-crf', '28', // Good quality vs size balance
        '-pix_fmt', 'yuv420p',
        '-vf', 'scale=640:480', // Smaller resolution for better performance
        'output.mp4'
      ]);
      
      console.log('📹 Reading generated video...');
      
      // Read the output file
      const data = await this.ffmpeg.readFile('output.mp4');
      const videoBlob = new Blob([data], { type: 'video/mp4' });
      
      console.log(`✅ Video generated successfully: ${videoBlob.size} bytes`);
      
      // Clean up files
      await this.cleanup();
      
      return videoBlob;
      
    } catch (error) {
      console.error('❌ Video generation failed:', error);
      await this.cleanup();
      throw error;
    }
  }
  
  private async cleanup() {
    try {
      // Clean up temporary files
      for (let i = 0; i < this.frames.length; i++) {
        const filename = `frame${i.toString().padStart(4, '0')}.png`;
        try {
          await this.ffmpeg.deleteFile(filename);
        } catch (e) {
          // File might not exist, ignore
        }
      }
      
      try {
        await this.ffmpeg.deleteFile('output.mp4');
      } catch (e) {
        // File might not exist, ignore
      }
      
      console.log('🧹 Cleaned up temporary files');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }
  
  reset() {
    this.frames = [];
    this.frameCount = 0;
    console.log('🔄 Timelapse generator reset');
  }
  
  getFrameCount(): number {
    return this.frameCount;
  }
  
  isReady(): boolean {
    return this.isLoaded;
  }
}