import React from 'react';
import { useGameStore } from '../store/gameStore';
import { BlockType } from '../types/game';

const BLOCKS: { type: BlockType; emoji: string }[] = [
  { type: 'grass', emoji: '🌱' },
  { type: 'water', emoji: '🌊' },
  { type: 'stone', emoji: '🪨' },
  { type: 'wood', emoji: '🪵' },
  { type: 'house', emoji: '🏠' },
  { type: 'tree', emoji: '🌳' }
];

export const BlockSelector = () => {
  const { currentTool, setCurrentTool } = useGameStore();
  
  console.log('BlockSelector rendering with currentTool:', currentTool);

  return (
    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        {BLOCKS.map(({ type, emoji }) => (
          <button
            key={type}
            onClick={() => setCurrentTool(type)}
            style={{
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '24px',
              backgroundColor: currentTool === type ? '#3b82f6' : '#6b7280'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
  );
};