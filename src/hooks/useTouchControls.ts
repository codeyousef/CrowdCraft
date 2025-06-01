import { useEffect, useState } from 'react';
import { useMediaQuery } from './useMediaQuery';

interface TouchState {
  scale: number;
  x: number;
  y: number;
}

export const useTouchControls = () => {
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [state, setState] = useState<TouchState>({
    scale: 1,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  });
  
  // Reset position when switching between mobile/desktop
  useEffect(() => {
    setState(prev => ({
      ...prev,
      scale: isMobile ? 0.75 : 1,
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    }));
  }, [isMobile]);
  
  useEffect(() => {
    let initialDistance = 0;
    let initialScale = 1;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isZooming = false;
    
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        initialScale = state.scale;
        isZooming = true;
      } else if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        isZooming = false;
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scale = Math.max(0.5, Math.min(1.5, (distance / initialDistance) * initialScale));
        
        setState(prev => ({ ...prev, scale }));
      } else if (e.touches.length === 1 && !isZooming) {
        const deltaX = e.touches[0].clientX - lastTouchX;
        const deltaY = e.touches[0].clientY - lastTouchY;
        
        setState(prev => ({
          ...prev,
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
    };

    const handleTouchEnd = () => {
      isZooming = false;
    };
    
    if (isMobile) {
      window.addEventListener('touchstart', handleTouchStart, { passive: false });
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      if (isMobile) {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [state.scale, isMobile]);
  
  return state;
};