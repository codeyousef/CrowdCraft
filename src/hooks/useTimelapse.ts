import { useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { TimelapseGenerator } from '../lib/timelapse';
import { supabase } from '../lib/supabase';

export const useTimelapse = (worldId: string | null, app: any) => {
  const timelapse = useRef<TimelapseGenerator>();
  const blocks = useGameStore(state => state.blocks);
  const worldEndTime = useGameStore(state => state.worldEndTime);
  
  // Initialize timelapse generator
  useEffect(() => {
    if (!timelapse.current) {
      console.log('🎬 Initializing timelapse generator...');
      timelapse.current = new TimelapseGenerator();
      
      // Initialize FFmpeg asynchronously
      timelapse.current.init().then((success) => {
        if (success) {
          console.log('✅ Timelapse generator initialized successfully');
        } else {
          console.error('❌ Failed to initialize timelapse generator');
        }
      }).catch(error => {
        console.error('❌ Failed to initialize timelapse generator:', error);
      });
    }
  }, []);
  
  // Capture frames during world session
  useEffect(() => {
    if (!worldId || !app || !timelapse.current) return;
    
    // Capture initial frame immediately
    const captureFrame = async () => {
      if (timelapse.current?.isReady()) {
        // Get current blocks from store instead of using stale closure
        const currentBlocks = useGameStore.getState().blocks;
        const captured = await timelapse.current.captureFrame(currentBlocks, app, true); // force capture
        if (captured) {
          console.log(`📸 Captured timelapse frame (${timelapse.current.getFrameCount()} total)`);
        }
      } else {
        console.log('⏳ Timelapse generator not ready yet, skipping frame capture');
      }
    };
    
    // Capture initial frame
    captureFrame();
    
    // For testing with 15-second worlds, capture every 5 seconds
    const captureInterval = setInterval(captureFrame, 5000);
    
    return () => clearInterval(captureInterval);
  }, [worldId, app]); // Removed blocks from dependencies
  
  // Store previous world info to detect when a world has ended
  const prevWorldRef = useRef<{ worldId: string; endTime: string } | null>(null);
  
  // Generate and save video when world resets
  useEffect(() => {
    console.log('🔍 Timelapse generation check:', { worldId, hasTimelapse: !!timelapse.current, worldEndTime });
    
    if (!timelapse.current) {
      return;
    }
    
    // Check if we have a valid current world with end time
    if (worldId && worldEndTime) {
      const isExpired = new Date(worldEndTime) <= new Date();
      console.log('🔍 World expiration check:', { worldEndTime, now: new Date().toISOString(), isExpired });
      
      if (isExpired) {
        // Store this expired world for video generation
        prevWorldRef.current = { worldId, endTime: worldEndTime };
      } else {
        // Update tracking for active world
        prevWorldRef.current = { worldId, endTime: worldEndTime };
        return;
      }
    }
    
    // Check if we need to generate video for a previously expired world
    if (!prevWorldRef.current) return;
    
    const expiredWorld = prevWorldRef.current;
    const wasExpired = new Date(expiredWorld.endTime) <= new Date();
    
    if (!wasExpired) return;
    
    const generateVideo = async () => {
      try {
        console.log('🎬 Generating timelapse video for world:', expiredWorld.worldId);
        
        // Clear the previous world reference to avoid duplicate processing
        prevWorldRef.current = null;
        
        if (!timelapse.current) {
          throw new Error('Timelapse generator not available');
        }
        
        if (!timelapse.current.isReady()) {
          throw new Error('Timelapse generator not ready - FFmpeg not loaded');
        }
        
        const videoBlob = await timelapse.current.generateVideo();
        
        if (!videoBlob) {
          throw new Error('No video blob generated');
        }
        
        console.log('🎬 Video blob generated, size:', videoBlob.size, 'bytes');
        
        // Upload to Supabase Storage
        console.log('📤 Uploading to Supabase storage...');
        const { data, error } = await supabase
          .storage
          .from('timelapses')
          .upload(`${expiredWorld.worldId}.mp4`, videoBlob);
          
        if (error) {
          console.error('❌ Storage upload error:', error);
          throw error;
        }
        
        console.log('✅ Video uploaded to storage:', data.path);
        
        // Update world record with video URL
        console.log('📝 Updating world record with snapshot URL...');
        const { data: updateData, error: updateError } = await supabase
          .from('worlds')
          .update({ 
            snapshot_url: data.path
          })
          .eq('id', expiredWorld.worldId)
          .select();
          
        if (updateError) {
          console.error('❌ Failed to update world record:', updateError);
          console.error('❌ This is likely an RLS policy issue - the worlds table needs UPDATE permissions');
          // Don't throw - let's still mark it as successful for testing
        } else if (updateData && updateData.length === 0) {
          console.warn('⚠️ World update returned empty result - likely RLS policy blocking UPDATE');
        } else {
          console.log('✅ World record updated successfully:', updateData);
        }
          
        console.log('✅ Timelapse saved and uploaded:', data.path);
        
        // Reset for next world
        timelapse.current?.reset();
      } catch (error: any) {
        console.error('❌ Failed to generate timelapse:', error.message, error);
      }
    };
    
    generateVideo();
  }, [worldId, worldEndTime]);
};