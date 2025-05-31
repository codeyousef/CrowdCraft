import { useCallback, useState, useEffect, useRef } from 'react';
import { Container, Sprite, Graphics, Stage, useApp } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { Block } from '../types/game';
import { cartesianToIsometric, isometricToCartesian } from '../lib/isometric';
import { TILE_CONFIG, GRID_SIZE } from '../types/game';
import { loadTextures } from '../lib/textures';
import { useViewport } from '../hooks/useViewport';
import { useTouchControls } from '../hooks/useTouchControls';
import { useRealtimeBlocks } from '../hooks/useRealtimeBlocks';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useGameStore } from '../store/gameStore';

interface IsometricGridContentProps {
  textures: Record<string, PIXI.Texture>;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  onTileHover: (tile: { x: number; y: number } | null) => void;
  onTileClick: (x: number, y: number) => void;
  hoveredTile: { x: number; y: number } | null;
}

const IsometricGridContent = ({ textures, viewport, onTileHover, onTileClick, hoveredTile }: IsometricGridContentProps) => {
  const { blocks } = useGameStore();
  const app = useApp();
  const containerRef = useRef<PIXI.Container>(null);

  const handleMove = useCallback((e: PIXI.FederatedPointerEvent) => {
    if (!containerRef.current) return;
    
    // Get position relative to the container (already in world space)
    const localPos = e.getLocalPosition(containerRef.current);
    
    // Convert from isometric to cartesian
    const cartesian = isometricToCartesian(localPos.x, localPos.y);
    const x = Math.floor(cartesian.x);
    const y = Math.floor(cartesian.y);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      onTileHover({ x, y });
    } else {
      onTileHover(null);
    }
  }, [onTileHover]);

  const handleClick = useCallback((e: PIXI.FederatedPointerEvent) => {
    if (!containerRef.current) return;
    
    // Get global position and convert to container space
    const globalPos = e.global;
    const localPos = new PIXI.Point(
      (globalPos.x - viewport.x) / viewport.scale,
      (globalPos.y - viewport.y) / viewport.scale
    );
    
    // Convert from isometric to cartesian
    const cartesian = isometricToCartesian(localPos.x, localPos.y);
    const x = Math.floor(cartesian.x);
    const y = Math.floor(cartesian.y);
    
    console.log('Click detected:', {
      global: globalPos,
      local: localPos,
      viewport: viewport,
      tile: { x, y }
    });
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      console.log('Valid click - placing block at:', { x, y });
      onTileClick(x, y);
    } else {
      console.log('Click outside grid bounds:', { x, y });
    }
  }, [onTileClick, viewport]);

  const renderBlock = useCallback((key: string, block: Block) => {
    const [x, y] = key.split(',').map(Number);
    const { isoX, isoY } = cartesianToIsometric(x, y);
    
    return (
      <Container key={key} x={isoX} y={isoY} zIndex={x + y}>
        <Sprite
          texture={textures[block.type]}
          anchor={0.5}
          width={TILE_CONFIG.width}
          height={TILE_CONFIG.height}
        />
      </Container>
    );
  }, [textures]);

  return (
    <Container 
      ref={containerRef}
      x={viewport.x}
      y={viewport.y}
      scale={viewport.scale}
      eventMode="static"
      onpointerdown={handleClick}
      onpointermove={handleMove}
      sortableChildren={true}
    >
      {/* Grid lines for reference */}
      <Graphics
        draw={g => {
          g.clear();
          g.lineStyle(1, 0x334155, 0.3);
          
          // Draw grid lines
          for (let i = 0; i <= GRID_SIZE; i++) {
            // Horizontal lines
            const hStart = cartesianToIsometric(i, 0);
            const hEnd = cartesianToIsometric(i, GRID_SIZE);
            g.moveTo(hStart.isoX, hStart.isoY);
            g.lineTo(hEnd.isoX, hEnd.isoY);
            
            // Vertical lines
            const vStart = cartesianToIsometric(0, i);
            const vEnd = cartesianToIsometric(GRID_SIZE, i);
            g.moveTo(vStart.isoX, vStart.isoY);
            g.lineTo(vEnd.isoX, vEnd.isoY);
          }
        }}
      />
      
      {/* Render all blocks */}
      {Array.from(blocks.entries()).map(([key, block]) => renderBlock(key, block))}
      
      {/* Hover indicator */}
      {hoveredTile && (
        <Container 
          x={cartesianToIsometric(hoveredTile.x, hoveredTile.y).isoX}
          y={cartesianToIsometric(hoveredTile.x, hoveredTile.y).isoY}
          zIndex={1000}
        >
          <Graphics
            draw={g => {
              g.clear();
              g.lineStyle(2, 0x6366F1, 1);
              g.beginFill(0x6366F1, 0.3);
              
              // Draw diamond shape for isometric tile
              g.moveTo(0, -TILE_CONFIG.height / 2);
              g.lineTo(TILE_CONFIG.width / 2, 0);
              g.lineTo(0, TILE_CONFIG.height / 2);
              g.lineTo(-TILE_CONFIG.width / 2, 0);
              g.closePath();
              
              g.endFill();
            }}
          />
        </Container>
      )}
    </Container>
  );
};

// Updated IsometricGrid component
export const IsometricGrid = () => {
  const { placeBlock } = useGameStore();
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [textures, setTextures] = useState<Record<string, PIXI.Texture>>();
  const desktopViewport = useViewport();
  const touchViewport = useTouchControls();
  const isTouchDevice = 'ontouchstart' in window;
  const viewport = isTouchDevice ? touchViewport : desktopViewport;
  const worldId = useGameStore(state => state.worldId);

  // Subscribe to real-time updates
  useRealtimeBlocks(worldId || '');

  useEffect(() => {
    loadTextures().then(setTextures);
  }, []);

  const handleTileClick = useCallback((x: number, y: number) => {
    console.log(`Placing block at (${x}, ${y})`);
    placeBlock(x, y);
  }, [placeBlock]);

  if (!textures) {
    return <LoadingSpinner />;
  }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      options={{ 
        backgroundColor: 0x0F172A,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      }}
    >
      <IsometricGridContent
        textures={textures}
        viewport={viewport}
        onTileHover={setHoveredTile}
        onTileClick={handleTileClick}
        hoveredTile={hoveredTile}
      />
    </Stage>
  );
};