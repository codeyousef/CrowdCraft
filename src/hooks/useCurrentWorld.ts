import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import { Block } from '../types/game';

export const useCurrentWorld = () => {
  const setWorldId = useGameStore(state => state.setWorldId);
  const setWorldTimer = useGameStore(state => state.setWorldTimer);
  const setBlocks = useGameStore(state => state.setBlocks);
  
  useEffect(() => {
    const loadCurrentWorld = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      try {
        const { data: worlds, error: fetchError } = await supabase
          .from('worlds')
          .select()
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (fetchError) throw fetchError;
        
        let world = worlds?.[0];
        
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
      } catch (error: any) {
        console.error('Failed to load current world:', error.message);
        if (error.message?.includes('FetchError')) {
          console.error('Connection to Supabase failed. Please check your environment variables and network connection.');
        }
        return;
      }
        
      if (world) {
        setWorldId(world.id);
        const resetAt = new Date(world.reset_at);
        const remainingTime = Math.max(0, Math.floor((resetAt.getTime() - Date.now()) / 1000));
        setWorldTimer(remainingTime);
        
        try {
          const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select()
            .eq('world_id', world.id);
          
          if (blocksError) throw blocksError;
          
          if (blocks) {
            const blockMap = new Map<string, Block>();
            blocks.forEach(block => {
              blockMap.set(`${block.x},${block.y}`, {
                type: block.block_type,
                placedBy: block.placed_by,
                placedAt: new Date(block.placed_at).getTime()
              });
            });
            setBlocks(blockMap);
          }
        } catch (error: any) {
          console.error('Failed to load blocks:', error.message);
        }
      }
    };
    
    loadCurrentWorld();
  }, [setWorldId, setWorldTimer, setBlocks]);
};