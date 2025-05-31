import { IsometricPoint, Point, TILE_CONFIG } from '../types/game';

export const cartesianToIsometric = (x: number, y: number): IsometricPoint => ({
  isoX: (x - y) * (TILE_CONFIG.width / 2),
  isoY: (x + y) * (TILE_CONFIG.height / 2)
});

export const isometricToCartesian = (isoX: number, isoY: number): Point => {
  // Correct inverse transformation
  const x = (isoX / (TILE_CONFIG.width / 2) + isoY / (TILE_CONFIG.height / 2)) / 2;
  const y = (isoY / (TILE_CONFIG.height / 2) - isoX / (TILE_CONFIG.width / 2)) / 2;
  return { x, y };  // Don't floor here - let the caller decide
};

// Helper function to get tile from screen coordinates
export const screenToTile = (
  screenX: number, 
  screenY: number, 
  viewport: { x: number; y: number; scale: number }
): Point => {
  // Convert screen to world coordinates
  const worldX = (screenX - viewport.x) / viewport.scale;
  const worldY = (screenY - viewport.y) / viewport.scale;
  
  // Convert world to tile coordinates
  const cartesian = isometricToCartesian(worldX, worldY);
  return {
    x: Math.floor(cartesian.x),
    y: Math.floor(cartesian.y)
  };
};

// Updated IsometricGridContent handleMove function
const handleMove = useCallback((e: PIXI.FederatedPointerEvent) => {
  if (!containerRef.current) return;
  
  // Get position relative to the container
  const localPos = e.getLocalPosition(containerRef.current);
  
  // Convert from isometric to cartesian
  const cartesian = isometricToCartesian(localPos.x, localPos.y);
  const x = Math.floor(cartesian.x);
  const y = Math.floor(cartesian.y);
  
  console.log('Mouse:', { 
    local: { x: localPos.x, y: localPos.y },
    cartesian: { x: cartesian.x, y: cartesian.y },
    tile: { x, y }
  });
  
  if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
    onTileHover({ x, y });
  } else {
    onTileHover(null);
  }
}, [onTileHover]);
