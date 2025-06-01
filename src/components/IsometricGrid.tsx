import { useCallback, useState, useEffect, useRef } from 'react';
import { Container, Sprite, Graphics, Stage, useApp } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { Block, GRID_SIZE, TILE_CONFIG } from '../types/game';
import { cartesianToIsometric, isometricToCartesian } from '../lib/isometric';
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
    
    // Convert global coordinates relative to the container
    const localPos = containerRef.current.toLocal(e.global);
    
    // Convert from isometric to cartesian and add centering offset
    const cartesian = isometricToCartesian(localPos.x, localPos.y);
    const x = Math.floor(cartesian.x + GRID_SIZE/2);
    const y = Math.floor(cartesian.y + GRID_SIZE/2);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      onTileHover({ x, y });
    } else {
      onTileHover(null);
    }
  }, [onTileHover]);


  const handleClick = useCallback((e: PIXI.FederatedPointerEvent) => {
    if (!containerRef.current) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // Convert global coordinates relative to the container
    const localPos = containerRef.current.toLocal(e.global);
    
    // Convert from isometric to cartesian and add centering offset
    const cartesian = isometricToCartesian(localPos.x, localPos.y);
    const x = Math.floor(cartesian.x + GRID_SIZE/2);
    const y = Math.floor(cartesian.y + GRID_SIZE/2);
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      onTileClick(x, y);
    }
  }, [onTileClick]);

  const renderBlock = useCallback((key: string, block: Block) => {
    const [x, y] = key.split(',').map(Number);
    // Center the grid by offsetting coordinates
    const { isoX, isoY } = cartesianToIsometric(x - GRID_SIZE/2, y - GRID_SIZE/2);
    
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
      cursor="pointer"
      hitArea={new PIXI.Rectangle(
        -GRID_SIZE * TILE_CONFIG.width / 2,
        -GRID_SIZE * TILE_CONFIG.height / 2,
        GRID_SIZE * TILE_CONFIG.width,
        GRID_SIZE * TILE_CONFIG.height
      )}
      onpointerdown={handleClick}
      onpointermove={handleMove}
      sortableChildren={true}
    >
      {/* Grid lines for reference */}
      <Graphics
        draw={g => {
          g.clear();
          g.lineStyle(1, 0x334155, 0.3);
          
          // Draw grid lines (centered)
          for (let i = 0; i <= GRID_SIZE; i++) {
            // Horizontal lines
            const hStart = cartesianToIsometric(i - GRID_SIZE/2, 0 - GRID_SIZE/2);
            const hEnd = cartesianToIsometric(i - GRID_SIZE/2, GRID_SIZE - GRID_SIZE/2);
            g.moveTo(hStart.isoX, hStart.isoY);
            g.lineTo(hEnd.isoX, hEnd.isoY);
            
            // Vertical lines
            const vStart = cartesianToIsometric(0 - GRID_SIZE/2, i - GRID_SIZE/2);
            const vEnd = cartesianToIsometric(GRID_SIZE - GRID_SIZE/2, i - GRID_SIZE/2);
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
          x={cartesianToIsometric(hoveredTile.x - GRID_SIZE/2, hoveredTile.y - GRID_SIZE/2).isoX}
          y={cartesianToIsometric(hoveredTile.x - GRID_SIZE/2, hoveredTile.y - GRID_SIZE/2).isoY}
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
    console.log('🎲 Attempting block placement:', {
      coordinates: { x, y },
      currentTool: useGameStore.getState().currentTool,
      worldId: useGameStore.getState().worldId,
      existingBlocks: useGameStore.getState().blocks.size
    });
    
    placeBlock(x, y);
  }, [placeBlock]);

  if (!textures) {
    return <LoadingSpinner />;
  }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      style={{ position: 'fixed', zIndex: 1 }}
      eventMode="static"
      options={{ 
        backgroundColor: 0x0F172A,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        eventFeatures: { 
          click: true, 
          move: true, 
          wheel: true,
          globalMove: true,
          globalClick: true
        },
        preserveDrawingBuffer: true,
        powerPreference: 'default'
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