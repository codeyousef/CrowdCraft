import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import { Block } from '../types/game';

export const useCurrentWorld = () => {
  const { setWorldId, setWorldTimes, setBlocks, worldId, initializeWorldTimer } = useGameStore();
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
        
    const loadCurrentWorld = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      try {
        // Always start with homepage - don't auto-join anymore
        console.log('🏠 Starting with homepage - auto join disabled');
        setWorldId(null);
        return;
      } catch (error: any) {
        console.error('Failed to load current world:', error.message);
        if (error.message?.includes('FetchError')) {
          console.error('Connection to Supabase failed. Please check your environment variables and network connection.');
        }
      }
    };
    
    const loadBlocksFromDatabase = async (worldId: string) => {
      const { data: blocks, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .eq('world_id', worldId);
      
      if (blocksError) throw blocksError;
      
      if (blocks) {
        const blockMap = new Map<string, Block>();
        console.log(`📦 Loading ${blocks.length} blocks from database...`);
        blocks.forEach(block => {
          blockMap.set(`${block.x},${block.y}`, {
            type: block.block_type,
            placedBy: block.placed_by,
            placedAt: new Date(block.placed_at).getTime()
          });
        });
        setBlocks(blockMap);
      }
    };
    
    loadCurrentWorld();
  }, []);
};