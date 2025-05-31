import { IsometricPoint, Point, TILE_CONFIG } from '../types/game';

export const cartesianToIsometric = (x: number, y: number): IsometricPoint => ({
  isoX: (x - y) * (TILE_CONFIG.width / 2),
  isoY: (x + y) * (TILE_CONFIG.height / 2)
});

export const isometricToCartesian = (isoX: number, isoY: number): Point => {
  // Adjust for tile dimensions
  const x = (2 * isoY + isoX) / (2 * TILE_CONFIG.width);
  const y = (2 * isoY - isoX) / (2 * TILE_CONFIG.width);
  return { x: Math.floor(x), y: Math.floor(y) };
};