import { Assets } from 'pixi.js';
import { BlockType } from '../types/game';

const TEXTURE_LOAD_TIMEOUT = 10000; // 10 seconds

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
  const loadTextureWithTimeout = async (key: string, url: string) => {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout loading texture: ${key}`)), TEXTURE_LOAD_TIMEOUT);
    });

    try {
      const texturePromise = Assets.load(url).then(texture => [key, texture]);
      const result = await Promise.race([texturePromise, timeoutPromise]);
      console.log(`✅ Loaded texture: ${key}`);
      return result;
    } catch (error) {
      console.error(`❌ Failed to load texture ${key}:`, error);
      throw error;
    }
  };

  const texturePromises = Object.entries(TEXTURE_URLS)
    .map(([key, url]) => loadTextureWithTimeout(key, url));
  
  try {
    const textures = await Promise.all(texturePromises);
    return Object.fromEntries(textures) as Record<BlockType, PIXI.Texture>;
  } catch (error) {
    console.error('❌ Failed to load all textures:', error);
    throw error;
  }
};