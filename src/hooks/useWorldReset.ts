import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useWorldReset = (worldId: string | null) => {
  const { setWorldId, setBlocks, worldTimer, setWorldTimer } = useGameStore();
  
  useEffect(() => {
    if (!worldId) return;
    
    const checkAndResetWorld = async () => {
      if (worldTimer <= 0) {
        // Create new world
        const newResetAt = new Date();
        newResetAt.setMinutes(newResetAt.getMinutes() + 30);
        
        try {
          const { data: newWorld, error } = await supabase
            .from('worlds')
            .insert({
              reset_at: newResetAt.toISOString(),
              total_blocks: 0,
              unique_builders: 0
            })
            .select()
            .single();
            
          if (error) throw error;
          
          if (newWorld) {
            console.log('🔄 World reset! New world ID:', newWorld.id);
            setWorldId(newWorld.id);
            setWorldTimer(1800); // 30 minutes
            setBlocks(new Map()); // Clear blocks
          }
        } catch (error: any) {
          console.error('Failed to create new world:', error.message);
        }
      }
    };
    
    checkAndResetWorld();
  }, [worldId, worldTimer]);
};