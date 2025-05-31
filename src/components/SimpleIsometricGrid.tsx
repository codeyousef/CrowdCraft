import React, { useCallback, useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { GRID_SIZE } from '../types/game';

export const IsometricGrid = () => {
  const { placeBlock, blocks, currentTool } = useGameStore();
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  
  // Grid constants
  const gridSize = 25;
  const centerX = 400;
  const centerY = 200;
  
  // Calculate initial viewport to center the grid
  const initialViewport = {
    x: window.innerWidth / 2 - centerX - (gridSize * 16), 
    y: window.innerHeight / 2 - centerY, 
    scale: 1 
  };
  const [viewport, setViewport] = useState(initialViewport);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTileClick = useCallback(async (x: number, y: number) => {
    console.log('🎲 Attempting block placement:', { x, y, currentTool });
    await placeBlock(x, y);
  }, [placeBlock, currentTool]);

  const handleTileHover = useCallback((x: number, y: number) => {
    setHoveredTile({ x, y });
  }, []);

  const handleTileLeave = useCallback(() => {
    setHoveredTile(null);
  }, []);

  // Handle zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setViewport(prev => ({
      ...prev,
      scale: Math.max(0.3, Math.min(3, prev.scale * zoomFactor))
    }));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.ctrlKey)) { // Middle click, right click, or Ctrl+click
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewport.x, y: e.clientY - viewport.y });
    }
  }, [viewport]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setViewport(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [handleWheel, handleMouseMove, handleMouseUp]);

  // Convert cartesian to isometric coordinates
  const cartesianToIsometric = (x: number, y: number) => ({
    isoX: (x - y) * 32, // 32 = TILE_WIDTH / 2
    isoY: (x + y) * 16  // 16 = TILE_HEIGHT / 2
  });

  // Convert screen coordinates to grid coordinates
  const screenToGrid = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    
    const localX = (screenX - rect.left - viewport.x - 400) / viewport.scale;
    const localY = (screenY - rect.top - viewport.y - 200) / viewport.scale;
    
    // Convert from isometric to cartesian
    const cartX = (localX / 32 + localY / 16) / 2;
    const cartY = (localY / 16 - localX / 32) / 2;
    
    return {
      x: Math.floor(cartX),
      y: Math.floor(cartY)
    };
  }, [viewport]);


  // Create clickable tiles and blocks
  const tiles = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const { isoX, isoY } = cartesianToIsometric(x, y);
      const key = `${x},${y}`;
      const block = blocks.get(key);
      const isHovered = hoveredTile?.x === x && hoveredTile?.y === y;

      tiles.push(
        <div
          key={key}
          style={{
            position: 'absolute',
            left: isoX + centerX, // Keep tile positioning exactly as is
            top: isoY + centerY,
            width: '64px',
            height: '32px',
            backgroundColor: block ? getBlockColor(block.type) : (isHovered ? 'rgba(99, 102, 241, 0.3)' : 'transparent'),
            border: '1px solid #334155', // Grid lines via borders
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', // Diamond shape
            zIndex: x + y + 10,
            boxShadow: isHovered ? '0 0 0 2px #6366f1' : 'none'
          }}
          onClick={() => handleTileClick(x, y)}
          onMouseEnter={() => handleTileHover(x, y)}
          onMouseLeave={handleTileLeave}
        >
          {block && getBlockEmoji(block.type)}
        </div>
      );
    }
  }

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0F172A',
        overflow: 'hidden',
        zIndex: 1,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
          transformOrigin: '0 0',
          width: '100%',
          height: '100%'
        }}
      >
        {/* Tiles and blocks */}
        {tiles}
      </div>
    </div>
  );
};

const getBlockColor = (type: string) => {
  const colors = {
    grass: '#10B981',
    water: '#06B6D4', 
    stone: '#6B7280',
    wood: '#92400E',
    house: '#DC2626',
    tree: '#059669'
  };
  return colors[type as keyof typeof colors] || '#6B7280';
};

const getBlockEmoji = (type: string) => {
  const emojis = {
    grass: '🌱',
    water: '🌊',
    stone: '🪨',
    wood: '🪵',
    house: '🏠',
    tree: '🌳'
  };
  return emojis[type as keyof typeof emojis] || '';
};