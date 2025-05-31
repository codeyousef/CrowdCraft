import { Stage, Container, Sprite } from '@pixi/react';
import { useCallback, useEffect, useState } from 'react';
import { cartesianToIsometric } from '../lib/isometric';
import { useGameStore } from '../store/gameStore';
import { GRID_SIZE, TILE_CONFIG } from '../types/game';

const BLOCK_TEXTURES = {
  grass: '🌱',
  water: '🌊',
  stone: '🪨',
  wood: '🪵',
  house: '🏠',
  tree: '🌳'
};

export const IsometricGrid = () => {
  const { blocks, placeBlock } = useGameStore();
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);

  const handleClick = useCallback((e: any) => {
    if (!hoveredTile) return;
    placeBlock(hoveredTile.x, hoveredTile.y);
  }, [hoveredTile, placeBlock]);

  const handleMove = useCallback((e: any) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    
    // Convert to isometric coordinates
    // TODO: Implement proper coordinate conversion
    setHoveredTile({ x: Math.floor(x / TILE_CONFIG.width), y: Math.floor(y / TILE_CONFIG.height) });
  }, []);

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      options={{ backgroundColor: 0x0F172A }}
      onPointerMove={handleMove}
      onPointerDown={handleClick}
    >
      <Container x={window.innerWidth / 2} y={window.innerHeight / 2}>
        {Array.from(blocks.entries()).map(([key, block]) => {
          const [x, y] = key.split(',').map(Number);
          const { isoX, isoY } = cartesianToIsometric(x, y);
          
          return (
            <Container key={key} x={isoX} y={isoY}>
              <text text={BLOCK_TEXTURES[block.type]} anchor={0.5} />
            </Container>
          );
        })}
      </Container>
    </Stage>
  );
};