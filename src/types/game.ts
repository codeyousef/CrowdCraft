export type BlockType = 'grass' | 'water' | 'stone' | 'wood' | 'house' | 'tree';

export interface Block {
  type: BlockType;
  placedBy: string;
  placedAt: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface IsometricPoint {
  isoX: number;
  isoY: number;
}

export const TILE_CONFIG = {
  width: 64,
  height: 32,
  depth: 16,
  mobile: {
    width: 48,
    height: 24,
    depth: 12
  }
} as const;

export const GRID_SIZE = 50;