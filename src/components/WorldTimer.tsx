import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const THIRTY_MINUTES = 1800; // 30 minutes in seconds

export const WorldTimer = () => {
  const { worldTimer, setWorldTimer } = useGameStore();

  useEffect(() => {
    const timer = setInterval(() => {
      setWorldTimer(prev => {
        if (typeof prev !== 'number' || isNaN(prev)) {
          return THIRTY_MINUTES;
        }
        return Math.max(0, prev - 1);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [setWorldTimer]);

  const validTimer = typeof worldTimer === 'number' && !isNaN(worldTimer) ? worldTimer : THIRTY_MINUTES;
  const minutes = Math.floor(validTimer / 60);
  const seconds = validTimer % 60;
  const progress = (validTimer / THIRTY_MINUTES) * 100;

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