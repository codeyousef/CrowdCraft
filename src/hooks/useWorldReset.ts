import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useWorldReset = (worldId: string | null) => {
  const { setWorldId, setBlocks, worldEndTime, setWorldTimes } = useGameStore();
  
  useEffect(() => {
    if (!worldId) return;
    
    const checkAndResetWorld = async () => {
      if (worldEndTime && new Date(worldEndTime) <= new Date()) {
        // Create new world
        try {
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
            console.log('🔄 World reset! New world ID:', newWorld.id);
            setWorldId(newWorld.id);
            setWorldTimes(null, null); // Reset times for new world
            setBlocks(new Map()); // Clear blocks
          }
        } catch (error: any) {
          console.error('Failed to create new world:', error.message);
        }
      }
    };
    
    checkAndResetWorld();
  }, [worldId, worldEndTime]);
};