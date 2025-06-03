import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';

export function useDevTimelapse() {
  const worldId = useGameStore(state => state.worldId);
  const worldEndTime = useGameStore(state => state.worldEndTime);
  const blocks = useGameStore(state => state.blocks);
  const uniqueBuilders = useGameStore(state => state.uniqueBuilders);

  useEffect(() => {
    if (!worldId || !worldEndTime) {
      return;
    }

    let hasProcessed = false;

    const checkWorldExpiry = async () => {
      const now = new Date();
      const endTime = new Date(worldEndTime);
      
      if (now >= endTime && !hasProcessed) {
        hasProcessed = true;
        // Save snapshot data when world expires
        const blocksArray = Array.from(blocks.values());
        console.log('Saving snapshot for world:', worldId);
        console.log('Blocks array:', blocksArray);
        
        const snapshotData = {
          world_id: worldId,
          snapshot_data: {
            blocks: blocksArray.map(b => ({
              x: b.x,
              y: b.y,
              block_type: b.block_type,
              placed_by: b.placed_by
            })),
            frame_count: Math.floor((now.getTime() - endTime.getTime() + 15 * 1000) / 5000),
            builders: blocksArray.map(b => b.placed_by).filter((v, i, a) => a.indexOf(v) === i)
          },
          block_count: blocksArray.length,
          unique_builders: uniqueBuilders
        };
        
        console.log('Snapshot data to save:', JSON.stringify(snapshotData, null, 2));

        try {
          // Insert snapshot
          const { error: snapshotError } = await supabase
            .from('world_snapshots')
            .insert(snapshotData);

          if (snapshotError) {
            console.error('❌ useDevTimelapse: Failed to save snapshot:', snapshotError);
            return;
          }
          

          // Update world with snapshot info
          const { error: updateError } = await supabase
            .from('worlds')
            .update({
              snapshot_url: `dev-world-${worldId}`,
              total_blocks: blocksArray.length,
              unique_builders: uniqueBuilders
            })
            .eq('id', worldId);

          if (updateError) {
            console.error('❌ useDevTimelapse: Failed to update world:', updateError);
          } else {
          }
        } catch (err) {
          console.error('Error saving development snapshot:', err);
        }
      }
    };

    const interval = setInterval(checkWorldExpiry, 1000); // Check every second for quick debugging
    return () => {
      clearInterval(interval);
      hasProcessed = false;
    };
  }, [worldId, worldEndTime, blocks, uniqueBuilders]);
}