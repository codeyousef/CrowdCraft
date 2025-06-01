import * as PIXI from 'pixi.js';
import { BlockType } from '../types/game';

export class TilePool {
  private pool: PIXI.Sprite[] = [];
  private active: Map<string, PIXI.Sprite> = new Map();
  private maxPoolSize = 1000; // Limit pool size to prevent memory bloat
  private textures: Record<BlockType, PIXI.Texture>;
  
  constructor(textures: Record<BlockType, PIXI.Texture>) {
    this.textures = textures;
  }
  
  private cullSprites(visibleKeys: Set<string>) {
    // Remove sprites that are no longer visible
    for (const [key, sprite] of this.active.entries()) {
      if (!visibleKeys.has(key)) {
        this.releaseSprite(key);
      }
    }
  }

  getSprite(x: number, y: number, type: BlockType): PIXI.Sprite {
    const key = `${x},${y}`;
    
    if (this.active.has(key)) {
      const sprite = this.active.get(key)!;
      sprite.texture = this.textures[type];
      return sprite;
    }
    
    const sprite = this.pool.pop() || new PIXI.Sprite();
    sprite.texture = this.textures[type];
    sprite.anchor.set(0.5);
    this.active.set(key, sprite);
    
    return sprite;
  }
  
  releaseSprite(key: string) {
    const sprite = this.active.get(key);
    
    if (sprite) {
      sprite.visible = false;
      this.active.delete(key);
      // Only add to pool if we haven't reached the limit
      if (this.pool.length < this.maxPoolSize) {
        this.pool.push(sprite);
      } else {
        sprite.destroy();
      }
    }
  }
  
  clear() {
    // Destroy all sprites to free memory
    this.active.forEach(sprite => sprite.destroy());
    this.active.clear();
    this.pool.forEach(sprite => sprite.destroy());
    this.pool = [];
  }

  updateVisibleTiles(visibleTiles: Set<string>) {
    this.cullSprites(visibleTiles);
  }
}