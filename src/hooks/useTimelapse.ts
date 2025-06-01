import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { TimelapseGenerator } from '../lib/timelapse';
import { supabase } from '../lib/supabase';

export const useTimelapse = (worldId: string | null, app: PIXI.Application | null) => {
  const timelapse = useRef<TimelapseGenerator>();
  const blocks = useGameStore(state => state.blocks);
  const worldTimer = useGameStore(state => state.worldTimer);
  
  // Initialize timelapse generator
  useEffect(() => {
    if (!timelapse.current) {
      timelapse.current = new TimelapseGenerator();
      timelapse.current.init();
    }
  }, []);
  
  // Capture frame every 30 seconds
  useEffect(() => {
    if (!worldId || !app || !timelapse.current) return;
    
    const captureInterval = setInterval(async () => {
      await timelapse.current?.captureFrame(blocks, app);
      console.log('📸 Captured timelapse frame');
    }, 30000);
    
    return () => clearInterval(captureInterval);
  }, [worldId, app, blocks]);
  
  // Generate and save video when world resets
  useEffect(() => {
    if (!worldId || !timelapse.current || worldTimer > 0) return;
    
    const generateVideo = async () => {
      try {
        console.log('🎬 Generating timelapse video...');
        const videoBlob = await timelapse.current?.generateVideo();
        
        // Upload to Supabase Storage
        const { data, error } = await supabase
          .storage
          .from('timelapses')
          .upload(`${worldId}.mp4`, videoBlob);
          
        if (error) throw error;
        
        // Update world record with video URL
        await supabase
          .from('worlds')
          .update({ 
            snapshot_url: data.path
          })
          .eq('id', worldId);
          
        console.log('✅ Timelapse saved:', data.path);
        
        // Reset for next world
        timelapse.current?.reset();
      } catch (error: any) {
        console.error('Failed to generate timelapse:', error.message);
      }
    };
    
    generateVideo();
  }, [worldId, worldTimer]);
};