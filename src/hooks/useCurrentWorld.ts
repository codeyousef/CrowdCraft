import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import { Block } from '../types/game';

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
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (fetchError) throw fetchError;
        
        let world = worlds?.[0];
        
        // If no world exists or current world has ended, create a new one
        if (!world || (world.reset_at && new Date(world.reset_at) < new Date())) {
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
          setWorldId(world.id);
          setWorldTimes(world.started_at, world.reset_at);
          console.log('✅ Loaded world:', { id: world.id, started: world.started_at, ends: world.reset_at });
          
          try {
            const { data: blocks, error: blocksError } = await supabase
              .from('blocks')
              .select('*')
              .eq('world_id', world.id);
            
            if (blocksError) throw blocksError;
            
            if (blocks) {
              const blockMap = new Map<string, Block>();
              console.log(`📦 Loading ${blocks.length} blocks...`);
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