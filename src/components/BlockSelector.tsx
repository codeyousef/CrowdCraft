import React from 'react';
import { useGameStore } from '../store/gameStore';
import { BlockType } from '../types/game';
import { useMediaQuery } from '../hooks/useMediaQuery';

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
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <div className="flex items-center justify-center gap-2 p-2">
        {BLOCKS.map(({ type, emoji }) => (
          <button
            key={type}
            onClick={() => setCurrentTool(type)}
            className={`
              flex items-center justify-center
              ${isMobile ? 'w-12 h-12' : 'w-14 h-14'}
              rounded-lg border-2 transition-all
              ${currentTool === type 
                ? 'bg-primary border-primary-hover scale-110' 
                : 'bg-surface-hover border-transparent hover:border-primary/50'}
              ${isMobile ? 'text-xl' : 'text-2xl'}
              active:scale-95
            `}
          >
            {emoji}
          </button>
        ))}
    </div>
  );
};