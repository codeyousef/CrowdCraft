import { useCallback, useState, useEffect, useRef } from 'react';
import { Container, Sprite, Graphics, Stage, useApp } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { Block, GRID_SIZE, TILE_CONFIG } from '../types/game';
import { cartesianToIsometric, isometricToCartesian } from '../lib/isometric';
import { loadTextures } from '../lib/textures';
import { useViewport } from '../hooks/useViewport';
import { useTouchControls } from '../hooks/useTouchControls';
import { useRealtimeBlocks } from '../hooks/useRealtimeBlocks';
import { usePointerLock } from '../hooks/usePointerLock';
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const interactionEnabled = useRef(true);
  const { isLocked, requestLock, exitLock } = usePointerLock(canvasRef);
  const lastPointerPos = useRef({ x: 0, y: 0 });

  const handleMove = useCallback((e: PIXI.FederatedPointerEvent) => {
    if (!containerRef.current) return;
    if (!interactionEnabled.current) return;
    
    // Handle pointer lock movement
    if (isLocked) {
      lastPointerPos.current.x += e.movementX;
      lastPointerPos.current.y += e.movementY;
    } else {
      lastPointerPos.current = e.global;
    }
    
    console.log('🖱️ Pointer move:', {
      type: e.type,
      position: isLocked ? lastPointerPos.current : e.global,
      movement: isLocked ? { x: e.movementX, y: e.movementY } : null,
      buttons: e.buttons,
      pressure: e.pressure,
      pointerType: e.pointerType
    });
    
    // Convert global coordinates to local space
    const pos = isLocked ? lastPointerPos.current : e.global;
    const localPos = new PIXI.Point(
      (pos.x - viewport.x) / viewport.scale,
      (pos.y - viewport.y) / viewport.scale
    );
    
    // Convert from isometric to cartesian
    const cartesian = isometricToCartesian(localPos.x, localPos.y);
    const x = Math.floor(cartesian.x);
    const y = Math.floor(cartesian.y);
    
    console.log('📍 Hover coordinates:', {
      local: localPos,
      cartesian: { x, y },
      inBounds: x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE
    });
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      onTileHover({ x, y });
    } else {
      onTileHover(null);
    }
  }, [onTileHover]);

  useEffect(() => {
    if (app.view) {
      canvasRef.current = app.view as HTMLCanvasElement;
    }
  }, [app.view]);

  const handleClick = useCallback((e: PIXI.FederatedPointerEvent) => {
    if (!containerRef.current) return;
    if (!interactionEnabled.current) return;
    
    console.log('🎯 Click event received:', {
      type: e.type,
      position: e.global,
      target: e.target?.constructor.name,
      currentTarget: e.currentTarget?.constructor.name,
      eventMode: containerRef.current.eventMode,
      interactive: containerRef.current.interactive,
      hitArea: containerRef.current.hitArea,
      worldTransform: containerRef.current.worldTransform.toArray(),
      localTransform: containerRef.current.localTransform.toArray()
    });
    
    console.log('🔍 Click event details:', {
      type: e.type,
      eventPhase: e.eventPhase,
      propagationStopped: e.propagationStopped,
      propagationImmediatelyStopped: e.propagationImmediatelyStopped,
      defaultPrevented: e.defaultPrevented,
      cancelBubble: e.cancelBubble,
      target: {
        type: e.target?.constructor.name,
        interactive: e.target?.eventMode,
        visible: e.target?.visible,
        parent: e.target?.parent?.constructor.name
      },
      currentTarget: {
        type: e.currentTarget?.constructor.name,
        interactive: e.currentTarget?.eventMode,
        visible: e.currentTarget?.visible,
        parent: e.currentTarget?.parent?.constructor.name
      },
      global: e.global,
      buttons: e.buttons,
      pressure: e.pressure,
      pointerType: e.pointerType,
      isPrimary: e.isPrimary
    });

    // Request pointer lock on first click if not already locked
    if (!isLocked && e.pointerType === 'mouse') {
      requestLock();
      return;
    }
    
    e.stopPropagation();
    e.preventDefault();
    
    // Get global position and convert to container space
    const globalPos = isLocked ? lastPointerPos.current : e.global;
    const localPos = new PIXI.Point(
      (globalPos.x - viewport.x) / viewport.scale,
      (globalPos.y - viewport.y) / viewport.scale
    );
    
    // Convert from isometric to cartesian
    const cartesian = isometricToCartesian(localPos.x, localPos.y);
    const x = Math.floor(cartesian.x);
    const y = Math.floor(cartesian.y);

    console.log('🎮 Click coordinates:', {
      global: globalPos,
      local: localPos,
      viewport: viewport,
      tile: { x, y },
      container: {
        position: containerRef.current?.position,
        scale: containerRef.current?.scale,
        worldTransform: containerRef.current?.worldTransform
      }
    });
    
    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
      console.log('✨ Valid click - attempting to place block:', { 
        x, y, 
        inBounds: true,
        gridSize: GRID_SIZE 
      });
      onTileClick(x, y);
    } else {
      console.warn('⚠️ Click outside grid bounds:', { 
        x, y, 
        gridSize: GRID_SIZE,
        reason: `Coordinates must be between 0 and ${GRID_SIZE-1}`
      });
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
      cursor="pointer"
      interactive={true}
      hitArea={new PIXI.Rectangle(
        -GRID_SIZE * TILE_CONFIG.width,
        -GRID_SIZE * TILE_CONFIG.height,
        GRID_SIZE * TILE_CONFIG.width * 2,
        GRID_SIZE * TILE_CONFIG.height * 2
      )}
      onpointerenter={() => { interactionEnabled.current = true; }}
      onpointerleave={() => { interactionEnabled.current = false; }}
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
        eventFeatures: { click: true, move: true, wheel: true }
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