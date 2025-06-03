import { useEffect, useRef } from 'react';

const FPS_SAMPLE_SIZE = 60;

export const usePerformanceMonitor = () => {
  const fpsRef = useRef<number[]>([]);
  const lastFrameRef = useRef(performance.now());
  
  useEffect(() => {
    const frame = () => {
      const now = performance.now();
      const delta = now - lastFrameRef.current;
      const fps = 1000 / delta;
      
      fpsRef.current.push(fps);
      if (fpsRef.current.length > FPS_SAMPLE_SIZE) {
        fpsRef.current.shift();
        
        const avgFps = Math.round(
          fpsRef.current.reduce((a, b) => a + b) / fpsRef.current.length
        );
        
        // Disable FPS warnings to prevent console spam feedback loop
        // if (avgFps < 55) {
        //   console.warn(`⚠️ Low FPS: ${avgFps}`);
        // }
      }
      
      lastFrameRef.current = now;
      requestAnimationFrame(frame);
    };
    
    requestAnimationFrame(frame);
  }, []);
};