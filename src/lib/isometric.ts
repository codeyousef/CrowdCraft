import { IsometricPoint, Point, TILE_CONFIG } from '../types/game';

export const cartesianToIsometric = (x: number, y: number): IsometricPoint => {
  // Ensure inputs are numbers and handle potential NaN
  if (typeof x !== 'number' || typeof y !== 'number' || isNaN(x) || isNaN(y)) {
    console.warn('Invalid coordinates provided to cartesianToIsometric:', { x, y });
    return { isoX: 0, isoY: 0 };
  }
  
  return {
    isoX: (x - y) * (TILE_CONFIG.width / 2),
    isoY: (x + y) * (TILE_CONFIG.height / 2)
  };
};

export const isometricToCartesian = (isoX: number, isoY: number): Point => {
  // Ensure inputs are numbers and handle potential NaN
  if (typeof isoX !== 'number' || typeof isoY !== 'number' || isNaN(isoX) || isNaN(isoY)) {
    console.error('Invalid coordinates provided to isometricToCartesian:', { isoX, isoY });
    return { x: 0, y: 0 };
  }

  // Correct inverse transformation
  const x = (isoX / (TILE_CONFIG.width / 2) + isoY / (TILE_CONFIG.height / 2)) / 2;
  const y = (isoY / (TILE_CONFIG.height / 2) - isoX / (TILE_CONFIG.width / 2)) / 2;
  
  console.log('Coordinate conversion:', {
    iso: { x: isoX, y: isoY },
    cartesian: { x, y },
    rounded: { x: Math.floor(x), y: Math.floor(y) }
  });
  
  return { x, y };  // Don't floor here - let the caller decide
};

export const screenToTile = (screenX: number, screenY: number, viewport: { x: number; y: number; scale: number }): Point => {
  // Adjust for viewport position and scale
  const adjustedX = (screenX - viewport.x) / viewport.scale;
  const adjustedY = (screenY - viewport.y) / viewport.scale;

  // Convert to cartesian coordinates
  const cartesian = isometricToCartesian(adjustedX, adjustedY);

  // Floor the values and ensure they're within grid bounds
  return {
    x: Math.floor(cartesian.x),
    y: Math.floor(cartesian.y)
  };
};