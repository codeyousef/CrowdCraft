import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

export const WorldTimer = () => {
  const { worldTimer, setWorldTimer } = useGameStore();

  // Ensure worldTimer is a valid number
  const validTimer = typeof worldTimer === 'number' && !isNaN(worldTimer) ? worldTimer : 1800;

  useEffect(() => {
    const timer = setInterval(() => {
      setWorldTimer(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [setWorldTimer]);

  const minutes = Math.floor(validTimer / 60);
  const seconds = validTimer % 60;
  const progress = (validTimer / 1800) * 100; // 30 minutes = 1800 seconds

  return (
    <div className="fixed top-0 left-0 right-0 bg-surface/80 backdrop-blur border-b border-border">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-center gap-4">
          <div className="text-lg font-medium">
            ⏱️ {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
          </div>
          <div className="w-48 h-2 bg-surface-hover rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};