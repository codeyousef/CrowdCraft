import { useState, useCallback, useEffect } from 'react';
import { TILE_CONFIG } from '../types/game';

interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

export const useViewport = () => {
  const [viewport, setViewport] = useState<ViewportState>({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    scale: 1
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    
    setViewport(current => {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.5, Math.min(2, current.scale * zoomFactor));
      
      // Zoom toward cursor position
      const mouseX = e.clientX - window.innerWidth / 2;
      const mouseY = e.clientY - window.innerHeight / 2;
      
      return {
        scale: newScale,
        x: current.x + (mouseX - mouseX * zoomFactor),
        y: current.y + (mouseY - mouseY * zoomFactor)
      };
    });
  }, []);
  
  const handleDragStart = useCallback((e: PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
  }, [viewport]);
  
  const handleDragMove = useCallback((e: PointerEvent) => {
    if (!isDragging) return;
    
    setViewport(current => ({
      ...current,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  }, [isDragging, dragStart]);
  
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);
  
  useEffect(() => {
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('pointerdown', handleDragStart);
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd);
    window.addEventListener('pointerleave', handleDragEnd);
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('pointerdown', handleDragStart);
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);
      window.removeEventListener('pointerleave', handleDragEnd);
    };
  }, [handleWheel, handleDragStart, handleDragMove, handleDragEnd]);
  
  return viewport;
};