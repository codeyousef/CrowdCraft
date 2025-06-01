import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const useWorldHistory = (worldId: string | null) => {
  const { blocks } = useGameStore();
  
  useEffect(() => {
    if (!worldId) return;
    
    // Subscribe to unique builders updates using postgres_changes
    const subscription = supabase
      .channel('world_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'worlds',
          filter: `id=eq.${worldId}`
        },
        (payload) => {
          if (payload.new && payload.new.unique_builders !== undefined) {
            useGameStore.getState().setUniqueBuilders(payload.new.unique_builders);
          }
        }
      )
      .subscribe();
    
    const saveSnapshot = async () => {
      // Convert blocks Map to array for storage
      const blockArray = Array.from(blocks.entries()).map(([key, block]) => {
        const [x, y] = key.split(',').map(Number);
        return {
          x,
          y,
          type: block.type,
          placedBy: block.placedBy,
          placedAt: block.placedAt
        };
      });
      
      // Get unique builders count
      const uniqueBuilders = new Set(blockArray.map(b => b.placedBy)).size;
      
      try {
        const { error } = await supabase
          .from('world_snapshots')
          .insert({
            world_id: worldId,
            snapshot_data: blockArray,
            block_count: blockArray.length,
            unique_builders: uniqueBuilders
          });
          
        if (error) throw error;
        console.log('📸 Saved world snapshot:', { blocks: blockArray.length, builders: uniqueBuilders });
      } catch (error: any) {
        console.error('Failed to save world snapshot:', error.message);
      }
    };
    
    // Save snapshot every 5 minutes
    const interval = setInterval(saveSnapshot, 5 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [worldId, blocks]);
};