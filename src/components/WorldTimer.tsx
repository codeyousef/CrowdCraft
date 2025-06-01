import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';

const THIRTY_MINUTES = 1800;

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
    <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-surface/90 backdrop-blur-sm border border-border rounded-b-lg shadow-lg">
      <div className="px-6 py-3">
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-semibold flex items-center gap-2">
            ⏱️ {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')} remaining
          </span>
          <div className="w-64 h-1.5 bg-surface-hover rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                progress <= 20 ? 'bg-red-500' : 
                progress <= 50 ? 'bg-yellow-500' : 
                'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};