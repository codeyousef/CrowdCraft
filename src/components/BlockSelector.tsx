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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur border-t border-border">
      <div className="flex items-center justify-center gap-2 p-4">
        {BLOCKS.map(({ type, emoji }) => (
          <button
            key={type}
            onClick={() => setCurrentTool(type)}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              currentTool === type ? 'bg-primary' : 'bg-surface-hover'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};