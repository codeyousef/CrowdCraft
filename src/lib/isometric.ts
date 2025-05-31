import { IsometricPoint, Point, TILE_CONFIG } from '../types/game';

export const cartesianToIsometric = (x: number, y: number): IsometricPoint => ({
  isoX: (x - y) * TILE_CONFIG.width / 2,
  isoY: (x + y) * TILE_CONFIG.height / 2
});

export const isometricToCartesian = (isoX: number, isoY: number): Point => {
  const x = (isoX / (TILE_CONFIG.width / 2) + isoY / (TILE_CONFIG.height / 2)) / 2;
  const y = (isoY / (TILE_CONFIG.height / 2) - isoX / (TILE_CONFIG.width / 2)) / 2;
  return { x: Math.floor(x), y: Math.floor(y) };
};