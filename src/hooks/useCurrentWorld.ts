import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useCurrentWorld = () => {
  const setWorldId = useGameStore(state => state.setWorldId);
  const setWorldTimer = useGameStore(state => state.setWorldTimer);
  
  useEffect(() => {
    const loadCurrentWorld = async () => {
      try {
        const { data: world, error } = await supabase
          .from('worlds')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
          
        if (error) throw error;
        
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