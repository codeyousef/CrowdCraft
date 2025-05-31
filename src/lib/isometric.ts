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