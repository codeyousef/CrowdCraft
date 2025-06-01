import React from 'react';
import { useGameStore } from '../store/gameStore';

export const PlayerName = () => {
  const userName = useGameStore(state => state.userName);
  
  return (
    <div className="fixed top-4 left-4 flex items-center gap-2 bg-surface/80 backdrop-blur rounded-lg px-4 py-2">
      <span className="text-primary">👤</span>
      <span className="text-sm text-text-secondary">
        {userName}
      </span>
    </div>
  );
};