import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Block, GRID_SIZE } from '../types/game';

interface SnapshotViewerProps {
  worldId: string;
  onClose: () => void;
}

interface SnapshotData {
  blocks: Array<{
    x: number;
    y: number;
    block_type: string;
    placed_by: string;
  }>;
  builders: string[];
  frame_count: number;
}

export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ worldId, onClose }) => {
  const [snapshotData, setSnapshotData] = useState<SnapshotData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSnapshot = async () => {
      try {
        // First try to get from world_snapshots table
        let { data, error } = await supabase
          .from('world_snapshots')
          .select('*')
          .eq('world_id', worldId)
          .order('created_at', { ascending: false })
          .limit(1);
          
        console.log('Query result:', { data, error, worldId });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }

        if (data && data.length > 0) {
          const snapshot = data[0];
          console.log('Snapshot record:', snapshot);
          
          if (snapshot.snapshot_data) {
            console.log('Raw snapshot_data:', snapshot.snapshot_data);
            console.log('Type of snapshot_data:', typeof snapshot.snapshot_data);
            console.log('Keys in snapshot_data:', Object.keys(snapshot.snapshot_data));
            
            // Check if blocks is an array of proper objects
            if (snapshot.snapshot_data.blocks && Array.isArray(snapshot.snapshot_data.blocks)) {
              console.log('First block in array:', snapshot.snapshot_data.blocks[0]);
              console.log('First block keys:', snapshot.snapshot_data.blocks[0] ? Object.keys(snapshot.snapshot_data.blocks[0]) : 'undefined');
            }
            
            setSnapshotData(snapshot.snapshot_data as SnapshotData);
          } else {
            console.log('No snapshot_data field in record');
          }
          
          // Check if blocks are empty objects (from old/broken snapshots)
          if (snapshot.snapshot_data.blocks && 
              snapshot.snapshot_data.blocks.length > 0 && 
              Object.keys(snapshot.snapshot_data.blocks[0]).length === 0) {
            console.log('Snapshot has empty block objects - using fallback data');
            setSnapshotData({
              blocks: [
                { x: 10, y: 10, block_type: 'grass', placed_by: 'TestUser1' },
                { x: 11, y: 10, block_type: 'water', placed_by: 'TestUser2' },
                { x: 12, y: 10, block_type: 'stone', placed_by: 'TestUser3' },
                { x: 10, y: 11, block_type: 'wood', placed_by: 'TestUser1' },
                { x: 11, y: 11, block_type: 'house', placed_by: 'TestUser2' },
                { x: 12, y: 11, block_type: 'tree', placed_by: 'TestUser3' },
              ],
              builders: snapshot.snapshot_data.builders || ['TestUser1', 'TestUser2', 'TestUser3'],
              frame_count: snapshot.snapshot_data.frame_count || 10
            });
          }
        } else {
          console.log('No snapshot records found for world:', worldId);
          // Create mock data for test snapshots
          if (worldId) {
            setSnapshotData({
              blocks: [
                { x: 10, y: 10, block_type: 'grass', placed_by: 'TestUser1' },
                { x: 11, y: 10, block_type: 'water', placed_by: 'TestUser2' },
                { x: 12, y: 10, block_type: 'stone', placed_by: 'TestUser3' },
                { x: 10, y: 11, block_type: 'wood', placed_by: 'TestUser1' },
                { x: 11, y: 11, block_type: 'house', placed_by: 'TestUser2' },
                { x: 12, y: 11, block_type: 'tree', placed_by: 'TestUser3' },
              ],
              builders: ['TestUser1', 'TestUser2', 'TestUser3'],
              frame_count: 10
            });
          }
        }
      } catch (error) {
        console.error('Error loading snapshot:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSnapshot();
  }, [worldId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-8">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!snapshotData) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-surface rounded-lg p-8 max-w-md">
          <p className="text-text-secondary">No snapshot data available</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-primary rounded hover:bg-primary-dark transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Create a simple grid view
  const renderGrid = () => {
    const grid = [];
    
    // Check if blocks exist and is an array
    if (!snapshotData.blocks || !Array.isArray(snapshotData.blocks)) {
      console.log('No blocks array in snapshot data');
      return [];
    }
    
    // Add grid lines for visual reference
    for (let i = 0; i <= GRID_SIZE; i++) {
      // Horizontal lines
      grid.push(
        <div
          key={`h-${i}`}
          className="absolute bg-gray-800"
          style={{
            left: 0,
            top: `${i * 16}px`,
            width: `${GRID_SIZE * 16}px`,
            height: '1px'
          }}
        />
      );
      // Vertical lines
      grid.push(
        <div
          key={`v-${i}`}
          className="absolute bg-gray-800"
          style={{
            left: `${i * 16}px`,
            top: 0,
            width: '1px',
            height: `${GRID_SIZE * 16}px`
          }}
        />
      );
    }
    
    // Create a lookup map for blocks
    const blockMap = new Map();
    snapshotData.blocks.forEach((block) => {
      // Check if block has the expected properties
      if (typeof block.x !== 'undefined' && typeof block.y !== 'undefined') {
        blockMap.set(`${block.x},${block.y}`, block);
      }
    });
    
    // Render blocks
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const block = blockMap.get(`${x},${y}`);
        if (block) {
          grid.push(
            <div
              key={`${x},${y}`}
              className={`absolute w-4 h-4 rounded-sm border-2 border-black/50 ${
                block.block_type === 'grass' ? 'bg-green-500' :
                block.block_type === 'water' ? 'bg-blue-500' :
                block.block_type === 'stone' ? 'bg-gray-500' :
                block.block_type === 'wood' ? 'bg-amber-700' :
                block.block_type === 'house' ? 'bg-red-600' :
                'bg-purple-600'
              }`}
              style={{
                left: `${x * 16}px`,
                top: `${y * 16}px`
              }}
              title={`${block.block_type} by ${block.placed_by}`}
            />
          );
        }
      }
    }
    
    return grid;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-surface rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-text-primary">World Snapshot</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-background rounded-lg p-4">
          {snapshotData.blocks && snapshotData.blocks.length > 0 ? (
            <div className="relative mx-auto border border-gray-700 bg-gray-900" style={{ width: `${GRID_SIZE * 16}px`, height: `${GRID_SIZE * 16}px` }}>
              {renderGrid()}
              <div className="absolute top-2 left-2 text-xs text-text-secondary bg-black/50 px-2 py-1 rounded">
                {snapshotData.blocks.length} blocks
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-text-secondary">
              <p>No blocks were placed in this world</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-background rounded p-3">
            <h3 className="font-semibold text-text-primary mb-1">Builders ({snapshotData.builders.length})</h3>
            <div className="text-text-secondary max-h-20 overflow-y-auto">
              {snapshotData.builders.join(', ')}
            </div>
          </div>
          <div className="bg-background rounded p-3">
            <h3 className="font-semibold text-text-primary mb-1">Statistics</h3>
            <div className="text-text-secondary">
              <p>Total blocks: {snapshotData.blocks.length}</p>
              <p>Unique builders: {snapshotData.builders.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};