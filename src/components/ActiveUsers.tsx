import React from 'react';
import { useGameStore } from '../store/gameStore';

export const ActiveUsers = () => {
  const activeUsers = useGameStore(state => state.activeUsers);
  
  return (
    <div className="fixed top-4 left-4 flex items-center gap-2 bg-surface/80 backdrop-blur rounded-full px-3 py-1.5">
      <span className="text-text-secondary text-sm">
        👥 {activeUsers.size} {activeUsers.size === 1 ? 'builder' : 'builders'}
      </span>
    </div>
  );
};