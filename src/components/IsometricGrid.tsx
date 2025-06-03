import { useCallback, useState, useEffect, useRef, useMemo } from 'react';
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
import { useTimelapse } from '../hooks/useTimelapse';
import { TilePool } from '../lib/TilePool';

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
  const { blocks, worldId } = useGameStore();
  const app = useApp();
  const containerRef = useRef<PIXI.Container>(null);
  const tilePoolRef = useRef<TilePool>();
  const frameRequestRef = useRef<number>();
  
  
  // Initialize timelapse system with the PIXI app
  useTimelapse(worldId, app);
  
  // Initialize TilePool
  useEffect(() => {
    tilePoolRef.current = new TilePool(textures);
    return () => tilePoolRef.current?.clear();
  }, [textures]);

  // Calculate visible area for culling
  const getVisibleArea = useCallback(() => {
    if (!containerRef.current || !app.renderer) return null;
    
    const bounds = new PIXI.Rectangle(
      -viewport.x / viewport.scale,
      -viewport.y / viewport.scale,
      app.renderer.width / viewport.scale,
      app.renderer.height / viewport.scale
    );
    
    return bounds;
  }, [viewport, app.renderer]);

  // Get visible tiles
  const getVisibleTiles = useCallback(() => {
    const visibleArea = getVisibleArea();
    if (!visibleArea) return new Set<string>();
    
    const visibleTiles = new Set<string>();
    const buffer = 2; // Add extra tiles for smooth scrolling
    
    blocks.forEach((_, key) => {
      const [x, y] = key.split(',').map(Number);
      const { isoX, isoY } = cartesianToIsometric(x - GRID_SIZE/2, y - GRID_SIZE/2);
      
      if (
        isoX >= visibleArea.left - buffer * TILE_CONFIG.width &&
        isoX <= visibleArea.right + buffer * TILE_CONFIG.width &&
        isoY >= visibleArea.top - buffer * TILE_CONFIG.height &&
        isoY <= visibleArea.bottom + buffer * TILE_CONFIG.height
      ) {
        visibleTiles.add(key);
      }
    });
    
    return visibleTiles;
  }, [blocks, getVisibleArea]);

  // Batch render updates
  const updateTiles = useCallback(() => {
    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current);
    }
    
    frameRequestRef.current = requestAnimationFrame(() => {
      const visibleTiles = getVisibleTiles();
      tilePoolRef.current?.updateVisibleTiles(visibleTiles);
    });
  }, [getVisibleTiles]);

  // Update visible tiles when viewport changes
  useEffect(() => {
    updateTiles();
  }, [viewport, updateTiles]);

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
      {/* Optimized grid lines */}
      <Graphics
        draw={g => {
          g.clear();
          g.lineStyle(1, 0x334155, 0.3);
          const visibleArea = getVisibleArea();
          if (!visibleArea) return;
          
          // Only draw visible grid lines
          const startX = Math.max(0, Math.floor(visibleArea.left / TILE_CONFIG.width));
          const endX = Math.min(GRID_SIZE, Math.ceil(visibleArea.right / TILE_CONFIG.width));
          const startY = Math.max(0, Math.floor(visibleArea.top / TILE_CONFIG.height));
          const endY = Math.min(GRID_SIZE, Math.ceil(visibleArea.bottom / TILE_CONFIG.height));
          
          for (let i = startX; i <= endX; i++) {
            // Horizontal lines
            const hStart = cartesianToIsometric(i - GRID_SIZE/2, 0 - GRID_SIZE/2);
            const hEnd = cartesianToIsometric(i - GRID_SIZE/2, GRID_SIZE - GRID_SIZE/2);
            g.moveTo(hStart.isoX, hStart.isoY);
            g.lineTo(hEnd.isoX, hEnd.isoY);
          }
          
          for (let i = startY; i <= endY; i++) {
            // Vertical lines
            const vStart = cartesianToIsometric(0 - GRID_SIZE/2, i - GRID_SIZE/2);
            const vEnd = cartesianToIsometric(GRID_SIZE - GRID_SIZE/2, i - GRID_SIZE/2);
            g.moveTo(vStart.isoX, vStart.isoY);
            g.lineTo(vEnd.isoX, vEnd.isoY);
          }
        }}
      />
      
      {/* Render all blocks */}
      {Array.from(blocks.entries())
        .filter(([key]) => getVisibleTiles().has(key))
        .map(([key, block]) => renderBlock(key, block))}
      
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
  const appRef = useRef<PIXI.Application>();
  const [loadingMessage, setLoadingMessage] = useState('Loading textures...');
  const [loadError, setLoadError] = useState<string>();

  // Subscribe to real-time updates
  useRealtimeBlocks(worldId || '');

  useEffect(() => {
    loadTextures()
      .then(textures => {
        setTextures(textures);
        console.log('✅ Textures loaded successfully');
      })
      .catch(error => {
        console.error('❌ Failed to load textures:', error);
        setLoadError('Failed to load game textures. Please check your connection and try again.');
      });
  }, []);

  const handleTileClick = useCallback((x: number, y: number) => {
    
    placeBlock(x, y);
  }, [placeBlock]);

  useEffect(() => {
    if (textures) {
      console.log('🎮 Rendering PIXI Stage with textures loaded');
    }
  }, [textures]);

  if (!textures) {
    return <LoadingSpinner message={loadingMessage} error={loadError} />;
  }

  return (
    <Stage
      width={window.innerWidth}
      height={window.innerHeight}
      style={{ position: 'fixed', zIndex: 1 }}
      onMount={app => { 
        appRef.current = app; 
        console.log('📱 PIXI app mounted, app reference set');
      }}
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