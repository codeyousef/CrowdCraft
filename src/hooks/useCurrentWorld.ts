import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useCurrentWorld = () => {
  const setWorldId = useGameStore(state => state.setWorldId);
  const setWorldTimer = useGameStore(state => state.setWorldTimer);
  
  useEffect(() => {
    const loadCurrentWorld = async () => {
      try {
        // First try to get the most recent world
        const { data: worlds, error: fetchError } = await supabase
          .from('worlds')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (fetchError) throw fetchError;
        
        let world = worlds?.[0];
        
        // If no world exists, create a new one
        if (!world) {
          const resetAt = new Date();
          resetAt.setMinutes(resetAt.getMinutes() + 30); // 30 minutes from now
          
          const { data: newWorld, error: createError } = await supabase
            .from('worlds')
            .insert([
              { 
                reset_at: resetAt.toISOString(),
                total_blocks: 0,
                unique_builders: 0
              }
            ])
            .select()
            .single();
            
          if (createError) throw createError;
          world = newWorld;
        }
        
        if (world) {
          setWorldId(world.id);
          // Calculate remaining time
          const resetAt = new Date(world.reset_at);
          const remainingTime = Math.max(0, Math.floor((resetAt.getTime() - Date.now()) / 1000));
          setWorldTimer(remainingTime);
          
          // Load initial blocks
          const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('*')
            .eq('world_id', world.id);
            
          if (blocksError) throw blocksError;
          
          blocks?.forEach(block => {
            useGameStore.getState().updateBlock(block.x, block.y, {
              type: block.block_type,
              placedBy: block.placed_by
            });
          });
        }
      } catch (error) {
        console.error('Failed to load current world:', error);
      }
    };
    
    loadCurrentWorld();
  }, [setWorldId, setWorldTimer]);
};