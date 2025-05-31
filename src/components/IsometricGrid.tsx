import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import * as PIXI from 'pixi.js';
import { cartesianToIsometric, isometricToCartesian } from '../lib/isometric';
import { loadTextures } from '../lib/textures';
import { useGameStore } from '../store/gameStore';
import { useRealtimeBlocks } from '../hooks/useRealtimeBlocks';
import { useViewport } from '../hooks/useViewport';
import { TilePool } from '../lib/TilePool';
import { GRID_SIZE, TILE_CONFIG } from '../types/game';

const IsometricGridContent: React.FC<{
  textures: Record<string, PIXI.Texture>;
  viewport: { x: number; y: number; scale: number };
  onTileHover: (tile: { x: number; y: number } | null) => void;
  onTileClick: () => void;
  hoveredTile: { x: number; y: number } | null;
}> = ({ textures, viewport, onTileHover, onTileClick, hoveredTile }) => {
  const { blocks } = useGameStore();
  const app = useApp();
  const tilePoolRef = useRef<TilePool>();
  
  useEffect(() => {
    tilePoolRef.current = new TilePool(textures);
    return () => tilePoolRef.current?.clear();
  }, [textures]);

  const handleMove = useCallback((e: PIXI.FederatedPointerEvent) => {
    const localPos = e.getLocalPosition(e.currentTarget);
    const screenX = (localPos.x - viewport.x) / viewport.scale;
    const screenY = (localPos.y - viewport.y) / viewport.scale;
    
    const cartesian = isometricToCartesian(screenX, screenY);
    if (cartesian.x >= 0 && cartesian.x < GRID_SIZE && cartesian.y >= 0 && cartesian.y < GRID_SIZE) {
      onTileHover(cartesian);
    } else {
      onTileHover(null);
    }
  }, [onTileHover, viewport]);

  return (
    <Container 
      x={viewport.x}
      y={viewport.y}
      scale={viewport.scale}
      eventMode="static"
      onpointerdown={onTileClick}
      onpointermove={handleMove}
    >
      {/* Grid lines for reference */}
      {Array.from({ length: GRID_SIZE + 1 }, (_, i) => (
        <Container key={`grid-${i}`}>
          <Graphics
            draw={g => {
              g.lineStyle(1, 0x334155, 0.2);
              const start = cartesianToIsometric(i, 0);
              const end = cartesianToIsometric(i, GRID_SIZE);
              g.moveTo(start.isoX, start.isoY);
              g.lineTo(end.isoX, end.isoY);
              
              const vStart = cartesianToIsometric(0, i);
              const vEnd = cartesianToIsometric(GRID_SIZE, i);
              g.moveTo(vStart.isoX, vStart.isoY);
              g.lineTo(vEnd.isoX, vEnd.isoY);
            }}
          />
        </Container>
      ))}
      
      {Array.from(blocks.entries()).map(([key, block]) => {
        const [x, y] = key.split(',').map(Number);
        const { isoX, isoY } = cartesianToIsometric(x, y);
        const sprite = tilePoolRef.current?.getSprite(x, y, block.type);
        
        if (!sprite) return null;
        
        return (
          <Container key={key} x={isoX} y={isoY}>
            {sprite}
          </Container>
        );
      })}
      
      {hoveredTile && (
        <Container 
          x={cartesianToIsometric(hoveredTile.x, hoveredTile.y).isoX}
          y={cartesianToIsometric(hoveredTile.x, hoveredTile.y).isoY}
        >
          <Graphics
            draw={g => {
              g.lineStyle(2, 0x6366F1, 0.8);
              g.beginFill(0x6366F1, 0.2);
              g.drawRect(
                -TILE_CONFIG.width / 2,
                -TILE_CONFIG.height / 2,
                TILE_CONFIG.width,
                TILE_CONFIG.height
              );
              g.endFill();
            }}
          />
        </Container>
      )}
    </Container>
  );
};

export const IsometricGrid = () => {
  const { placeBlock } = useGameStore();
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [textures, setTextures] = useState<Record<string, PIXI.Texture>>();
  const viewport = useViewport();
  const worldId = useGameStore(state => state.worldId);

  // Subscribe to real-time updates
  useRealtimeBlocks(worldId || '');

  useEffect(() => {
    loadTextures().then(setTextures);
  }, []);

  const handleClick = useCallback(() => {
    if (!hoveredTile) return;
    placeBlock(hoveredTile.x, hoveredTile.y);
  }, [hoveredTile, placeBlock]);

  if (!textures) {
    return null;
  }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      options={{ 
        backgroundColor: 0x0F172A,
        antialias: true,
        resolution: window.devicePixelRatio || 1
      }}
    >
      <IsometricGridContent
        textures={textures}
        viewport={viewport}
        onTileHover={setHoveredTile}
        onTileClick={handleClick}
        hoveredTile={hoveredTile}
      />
    </Stage>
  );
};