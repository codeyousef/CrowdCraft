import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useRealtimeBlocks = (worldId: string) => {
  const updateBlock = useGameStore(state => state.updateBlock);
  
  useEffect(() => {
    const channel = supabase
      .channel(`world:${worldId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'blocks',
        filter: `world_id=eq.${worldId}`
      }, payload => {
        const { x, y, block_type, placed_by } = payload.new;
        updateBlock(x, y, { type: block_type, placedBy: placed_by });
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [worldId, updateBlock]);
};