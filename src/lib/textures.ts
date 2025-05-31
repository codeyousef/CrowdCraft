import { Assets } from 'pixi.js';
import { BlockType } from '../types/game';

// Using Pexels images for textures as per technology preferences
const TEXTURE_URLS = {
  grass: 'https://images.pexels.com/photos/413195/pexels-photo-413195.jpeg',
  water: 'https://images.pexels.com/photos/1001682/pexels-photo-1001682.jpeg',
  stone: 'https://images.pexels.com/photos/220040/pexels-photo-220040.jpeg',
  wood: 'https://images.pexels.com/photos/172292/pexels-photo-172292.jpeg',
  house: 'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg',
  tree: 'https://images.pexels.com/photos/957024/forest-trees-perspective-bright-957024.jpeg'
};

export const loadTextures = async () => {
  const texturePromises = Object.entries(TEXTURE_URLS).map(([key, url]) => 
    Assets.load(url).then(texture => [key, texture])
  );
  
  const textures = await Promise.all(texturePromises);
  return Object.fromEntries(textures) as Record<BlockType, PIXI.Texture>;
};