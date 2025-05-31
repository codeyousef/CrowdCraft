import React from 'react';
import { useGameStore } from '../store/gameStore';
import { BlockType } from '../types/game';
import { usePointerLock } from '../hooks/usePointerLock';

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
  const { isLocked, exitLock } = usePointerLock({ current: document.body });

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur border-t border-border">
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2">
        {BLOCKS.map(({ type, emoji }) => (
          <button
            key={type}
            onClick={() => {
              setCurrentTool(type);
              if (isLocked) exitLock();
            }}
            className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors ${
              currentTool === type ? 'bg-primary' : 'bg-surface-hover'
            }`}
          >
            <span className="text-2xl">{emoji}</span>
          </button>
        ))}
        </div>
        {isLocked && (
          <button
            onClick={exitLock}
            className="px-4 py-2 bg-surface-hover hover:bg-primary rounded-lg text-sm"
          >
            Exit Mouse Lock (Esc)
          </button>
        )}
      </div>
    </div>
  );
};