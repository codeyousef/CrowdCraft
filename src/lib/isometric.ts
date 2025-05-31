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
  
  console.log('🔄 Coordinate conversion:', {
    iso: { x: isoX, y: isoY },
    cartesian: { x, y },
    rounded: { x: Math.floor(x), y: Math.floor(y) },
    tileSize: { width: TILE_CONFIG.width, height: TILE_CONFIG.height }
  });
  
  return { x, y };  // Don't floor here - let the caller decide
};

export const screenToTile = (screenX: number, screenY: number, viewport: { x: number; y: number; scale: number }): Point => {
  console.log('🎯 Screen to tile conversion:', {
    input: { screenX, screenY },
    viewport: { ...viewport },
    devicePixelRatio: window.devicePixelRatio
  });

  // Adjust for viewport position and scale
  const adjustedX = (screenX - viewport.x) / viewport.scale;
  const adjustedY = (screenY - viewport.y) / viewport.scale;
  
  console.log('📐 Adjusted coordinates:', {
    adjusted: { x: adjustedX, y: adjustedY },
    scale: viewport.scale
  });

  // Convert to cartesian coordinates
  const cartesian = isometricToCartesian(adjustedX, adjustedY);
  
  const result = {
    x: Math.floor(cartesian.x),
    y: Math.floor(cartesian.y)
  };
  
  console.log('🎲 Final tile coordinates:', {
    cartesian,
    result,
    valid: result.x >= 0 && result.x < GRID_SIZE && result.y >= 0 && result.y < GRID_SIZE
  });

  return result;
};