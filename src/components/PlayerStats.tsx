import React from 'react';
import { useGameStore } from '../store/gameStore';

export const PlayerStats = () => {
  const { activeUsers, uniqueBuilders } = useGameStore();
  
  // Format numbers with commas
  const formatNumber = (num: number) => num.toLocaleString();
  
  return (
    <div className="fixed top-4 right-4 flex items-center gap-4 bg-surface/80 backdrop-blur rounded-lg px-4 py-2">
      <div className="flex items-center gap-2">
        <span className="text-primary">👥</span>
        <span className="text-sm text-text-secondary">
          {formatNumber(activeUsers.size)} online
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-primary">🏗️</span>
        <span className="text-sm text-text-secondary">
          {formatNumber(uniqueBuilders)} builders
        </span>
      </div>
    </div>
  );
};