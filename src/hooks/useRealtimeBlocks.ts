import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useRealtimeBlocks = (worldId: string) => {
  const updateBlock = useGameStore(state => state.updateBlock);
  const retryRef = useRef<number>(0);
  const maxRetries = 20; // Increased from 3 to 20 for better resilience
  
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel>;
    
    const setupChannel = () => {
      if (retryRef.current >= maxRetries) {
        console.error('Max retries reached for realtime connection');
        return;
      }
      
      channel = supabase
      .channel(`world:${worldId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'blocks',
        filter: `world_id=eq.${worldId}`
      }, payload => {
        const { x, y, block_type, placed_by } = payload.new;
        
        // Debounce updates to prevent overwhelming the renderer
        requestAnimationFrame(() => {
          updateBlock(x, y, { type: block_type, placedBy: placed_by });
        });
      })
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          retryRef.current = 0;
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          retryRef.current++;
          setTimeout(setupChannel, 1000 * Math.pow(2, retryRef.current));
        }
      })
    };
    
    setupChannel();
      
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [worldId, updateBlock]);
};