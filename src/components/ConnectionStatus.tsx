import React from 'react';
import { useGameStore } from '../store/gameStore';

export const ConnectionStatus = () => {
  const { connectionStatus } = useGameStore();
  
  return (
    <div className="fixed top-4 right-4 flex items-center gap-2 bg-surface/80 backdrop-blur rounded-full px-3 py-1.5 text-sm">
      <div 
        className={`w-2 h-2 rounded-full ${
          connectionStatus === 'connected' ? 'bg-emerald-500' :
          connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' :
          'bg-red-500'
        }`} 
      />
      <span className="text-text-secondary">
        {connectionStatus === 'connected' ? 'Connected' :
         connectionStatus === 'connecting' ? 'Connecting...' :
         'Disconnected'}
      </span>
    </div>
  );
};