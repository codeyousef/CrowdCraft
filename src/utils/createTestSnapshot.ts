import { supabase } from '../lib/supabase';

// Create a test snapshot for development
async function createTestSnapshot() {
  if (import.meta.env.DEV) {
    try {
      // Check if we already have worlds with snapshots
      const { data: existingSnapshots } = await supabase
        .from('worlds')
        .select('*')
        .not('snapshot_url', 'is', null)
        .limit(1);

      if (existingSnapshots && existingSnapshots.length > 0) {
        return; // Already have test data
      }

      // Get a recent world to create a test snapshot for
      const { data: worlds } = await supabase
        .from('worlds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (worlds && worlds.length > 0) {
        const world = worlds[0];
        
        // Create test snapshot
        const snapshotData = {
          world_id: world.id,
          snapshot_data: {
            blocks: [],
            frame_count: 120,
            builders: ['TestUser1', 'TestUser2', 'TestUser3', 'TestUser4', 'TestUser5']
          },
          block_count: 150,
          unique_builders: 5
        };

        await supabase
          .from('world_snapshots')
          .insert(snapshotData);

        // Update world with snapshot info
        await supabase
          .from('worlds')
          .update({
            snapshot_url: `test-world-${world.id}`,
            total_blocks: 150,
            unique_builders: 5
          })
          .eq('id', world.id);

      }
    } catch (err) {
      console.error('Error creating test snapshot:', err);
    }
  }
}

// Run on import
createTestSnapshot();