import React from 'react';
import { useGameStore } from '../store/gameStore';

export const PlayerStats = () => {
  const { activeUsers, uniqueBuilders } = useGameStore();
  
  return (
    <div className="fixed top-4 right-4 flex items-center gap-4 bg-surface/80 backdrop-blur rounded-lg px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-primary">👥</span>
        <span className="text-sm text-text-secondary">
          {activeUsers.size} online
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-primary">🏗️</span>
        <span className="text-sm text-text-secondary">
          {uniqueBuilders} builders
        </span>
      </div>
    </div>
  );
};