import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { differenceInSeconds, formatDistance } from 'date-fns';

export const WorldTimer = () => {
  const { worldStartTime, worldEndTime } = useGameStore();
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 WorldTimer state:', { 
      worldStartTime, 
      worldEndTime,
      timeUntilEnd: worldEndTime ? Math.max(0, Math.floor((new Date(worldEndTime).getTime() - Date.now()) / 1000)) : 'no end time',
      hasStartTime: !!worldStartTime,
      hasEndTime: !!worldEndTime
    });
  }, [worldStartTime, worldEndTime]);

  useEffect(() => {
    const updateTimer = () => {
      if (!worldEndTime) {
        setRemainingSeconds(null);
        return;
      }

      const now = new Date();
      const end = new Date(worldEndTime);
      const remaining = differenceInSeconds(end, now);
      setRemainingSeconds(Math.max(0, remaining));
    };

    // Update immediately
    updateTimer();

    // Then update every second
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [worldEndTime]);

  if (!worldStartTime || !worldEndTime) {
    return (
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-50 bg-surface/90 backdrop-blur-sm border border-border rounded-b-lg shadow-lg">
        <div className="px-6 py-3">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xl font-semibold flex items-center gap-2">
              ⏱️ Place the first block to start
            </span>
          </div>
        </div>
      </div>
    );
  }

  const minutes = Math.floor((remainingSeconds || 0) / 60);
  const seconds = (remainingSeconds || 0) % 60;
  
  // Calculate total duration from start and end times
  const totalDuration = worldStartTime && worldEndTime 
    ? differenceInSeconds(new Date(worldEndTime), new Date(worldStartTime))
    : 30 * 60; // fallback to 30 minutes
    
  const progress = ((remainingSeconds || 0) / totalDuration) * 100;

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
          <div className="text-sm text-text-secondary">
            Started {formatDistance(new Date(worldStartTime), new Date(), { addSuffix: true })}
          </div>
        </div>
      </div>
    </div>
  );
};