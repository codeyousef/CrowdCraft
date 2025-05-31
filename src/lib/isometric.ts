import { IsometricPoint, Point, TILE_CONFIG } from '../types/game';

export const cartesianToIsometric = (x: number, y: number): IsometricPoint => {
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
    return { isoX: 0, isoY: 0 };
  }
  
  return {
    isoX: (x - y) * (TILE_CONFIG.width / 2),
    isoY: (x + y) * (TILE_CONFIG.height / 2)
  };
};

export const isometricToCartesian = (isoX: number, isoY: number): Point => {
  if (typeof isoX !== 'number' || typeof isoY !== 'number' || isNaN(isoX) || isNaN(isoY)) {
    return { x: 0, y: 0 };
  }

  const x = (isoX / (TILE_CONFIG.width / 2) + isoY / (TILE_CONFIG.height / 2)) / 2;
  const y = (isoY / (TILE_CONFIG.height / 2) - isoX / (TILE_CONFIG.width / 2)) / 2;
  
  return { x, y };
};

export const screenToTile = (screenX: number, screenY: number, viewport: { x: number; y: number; scale: number }): Point => {
  const adjustedX = (screenX - viewport.x) / viewport.scale;
  const adjustedY = (screenY - viewport.y) / viewport.scale;
  const cartesian = isometricToCartesian(adjustedX, adjustedY);
  
  return {
    x: Math.floor(cartesian.x),
    y: Math.floor(cartesian.y)
  };
};