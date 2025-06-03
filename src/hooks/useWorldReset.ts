import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useWorldReset = (worldId: string | null) => {
  const { setWorldId, setBlocks, worldEndTime, setWorldTimes } = useGameStore();
  const isResetting = useRef(false);
  
  useEffect(() => {
    if (!worldId || !worldEndTime) return;
    
    const checkAndResetWorld = async () => {
      if (isResetting.current) return; // Prevent multiple resets
      
      const now = new Date();
      const endTime = new Date(worldEndTime);
      const timeRemaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
      
      
      if (endTime <= now) {
        isResetting.current = true;
        
        try {
          // Capture final screenshot before reset
          
          // Wait for snapshot creation to complete
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Create new world
          const { data: newWorld, error } = await supabase
            .from('worlds')
            .insert({
              total_blocks: 0,
              unique_builders: 0
            })
            .select()
            .single();
            
          if (error) throw error;
          
          if (newWorld) {
            setWorldId(newWorld.id);
            setWorldTimes(null, null); // Reset times for new world
            setBlocks(new Map()); // Clear blocks
            
            // Reset the flag after successful reset
            setTimeout(() => {
              isResetting.current = false;
            }, 1000);
          }
        } catch (error: any) {
          console.error('Failed to create new world:', error.message);
          isResetting.current = false;
        }
      }
    };
    
    // Check immediately
    checkAndResetWorld();
    
    // Then check every 5 seconds to catch timer expiration
    const interval = setInterval(checkAndResetWorld, 5000);
    
    return () => clearInterval(interval);
  }, [worldId, worldEndTime, setWorldId, setBlocks, setWorldTimes]);
};