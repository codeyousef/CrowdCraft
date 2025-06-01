import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import { Block, BlockType } from '../types/game';

export const useCurrentWorld = () => {
  const { setWorldId, setWorldTimes, setBlocks } = useGameStore();
  
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
          .order('started_at', { ascending: false })
          .not('started_at', 'is', null)
          .limit(1);
          
        if (fetchError) throw fetchError;
        
        let world = worlds?.[0];
        
        // If no active world exists, create one
        if (!world || (world.reset_at && new Date(world.reset_at) <= new Date())) {
          const { data: newWorld, error: createError } = await supabase
            .from('worlds')
            .insert([
              { 
                total_blocks: 0,
                unique_builders: 0
              }
            ])
            .select()
            .single();
            
          if (createError) throw createError;
          world = newWorld;
        }
        
        if (world && typeof world === 'object' && 'id' in world) {
          setWorldTimes(world.started_at, world.reset_at);
          
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
        } else {
          console.error('Invalid world data structure:', world);
        }
      } catch (error: any) {
        console.error('Failed to load current world:', error.message);
        if (error.message?.includes('FetchError')) {
          console.error('Connection to Supabase failed. Please check your environment variables and network connection.');
        }
      }
    };
    
    loadCurrentWorld();
  }, [setWorldId, setWorldTimes, setBlocks]);
};