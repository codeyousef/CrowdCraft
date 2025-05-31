import React from 'react';
import { BlockSelector } from './components/BlockSelector';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useGameStore } from './store/gameStore';
import { supabase } from './lib/supabase';
import { useState, useEffect } from 'react';

interface DebugMessage {
  text: string;
  timestamp: number;
}

// Simple grid component
const SimpleGrid = () => {
  const { currentTool, placeBlock, blocks } = useGameStore();
  const [hoveredCell, setHoveredCell] = useState<{x: number, y: number} | null>(null);

  const handleCellClick = async (x: number, y: number) => {
    console.log('Clicking cell:', x, y, 'with tool:', currentTool);
    try {
      await placeBlock(x, y);
      console.log('Block placed successfully');
    } catch (error) {
      console.error('Error placing block:', error);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(20, 30px)',
      gridTemplateRows: 'repeat(20, 30px)',
      gap: '1px',
      backgroundColor: '#334155',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      {Array.from({length: 400}, (_, i) => {
        const x = i % 20;
        const y = Math.floor(i / 20);
        const key = `${x},${y}`;
        const block = blocks.get(key);
        const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;
        
        return (
          <div
            key={i}
            style={{
              width: '30px',
              height: '30px',
              backgroundColor: block ? getBlockColor(block.type) : (isHovered ? '#6366f1' : '#1e293b'),
              border: '1px solid #475569',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px'
            }}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => setHoveredCell({x, y})}
            onMouseLeave={() => setHoveredCell(null)}
          >
            {block && getBlockEmoji(block.type)}
          </div>
        );
      })}
    </div>
  );
};

const getBlockColor = (type: string) => {
  const colors = {
    grass: '#10B981',
    water: '#06B6D4', 
    stone: '#6B7280',
    wood: '#92400E',
    house: '#DC2626',
    tree: '#059669'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
};

const getBlockEmoji = (type: string) => {
  const emojis = {
    grass: '🌱',
    water: '🌊',
    stone: '🪨',
    wood: '🪵',
    house: '🏠',
    tree: '🌳'
  };
  return emojis[type as keyof typeof emojis] || '';
};

function App() {
  const { currentTool, worldId, setWorldId } = useGameStore();
  
  useEffect(() => {
    // Set a test world ID and ensure it exists
    if (!worldId) {
      const createWorld = async () => {
        // Generate a proper UUID for the world
        const testWorldId = crypto.randomUUID();
        
        try {
          // Create world in database
          const { error } = await supabase
            .from('worlds')
            .insert({
              id: testWorldId,
              reset_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
              total_blocks: 0,
              unique_builders: 0
            });
            
          if (error) throw error;
          
          setWorldId(testWorldId);
          console.log('✅ Created world in database:', testWorldId);
        } catch (error: any) {
          console.error('Failed to create world:', error.message);
          // Still set the world ID for local testing
          setWorldId(testWorldId);
          console.log('⚠️ Using local world only:', testWorldId);
        }
      };
      
      createWorld();
    }
  }, [worldId, setWorldId]);

  return (
    <ErrorBoundary>
      <div style={{
        height: '100vh',
        width: '100vw',
        backgroundColor: '#0F172A',
        color: '#F8FAFC',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h1 style={{marginBottom: '20px', fontSize: '24px'}}>CrowdCraft</h1>
        <p style={{marginBottom: '10px'}}>Current tool: {currentTool}</p>
        <p style={{marginBottom: '10px', fontSize: '14px'}}>
          World ID: {worldId || 'None'} | Blocks: {useGameStore(state => state.blocks.size)}
        </p>
        <SimpleGrid />
        <div style={{
          backgroundColor: '#1e293b',
          borderTop: '2px solid #6366f1',
          padding: '16px',
          borderRadius: '8px'
        }}>
          <BlockSelector />
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;