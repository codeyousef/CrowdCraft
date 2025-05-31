import * as PIXI from 'pixi.js';
import { BlockType } from '../types/game';

export class TilePool {
  private pool: PIXI.Sprite[] = [];
  private active: Map<string, PIXI.Sprite> = new Map();
  private textures: Record<BlockType, PIXI.Texture>;
  
  constructor(textures: Record<BlockType, PIXI.Texture>) {
    this.textures = textures;
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
  
  releaseSprite(x: number, y: number) {
    const key = `${x},${y}`;
    const sprite = this.active.get(key);
    
    if (sprite) {
      sprite.visible = false;
      this.active.delete(key);
      this.pool.push(sprite);
    }
  }
  
  clear() {
    this.active.clear();
    this.pool = [];
  }
}