import { create } from 'zustand';
import { Block, BlockType, Point } from '../types/game';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';

interface GameState {
  blocks: Map<string, Block>;
  currentTool: BlockType;
  userName: string;
  activeUsers: Set<string>;
  worldTimer: number;
  setWorldId: (id: string | null) => void;
  setWorldTimer: (time: number) => void;
  setBlocks: (blocks: Map<string, Block>) => void;
  worldId: string | null;
  placeBlock: (x: number, y: number) => void;
  setCurrentTool: (tool: BlockType) => void;
  updateBlock: (x: number, y: number, block: Omit<Block, 'placedAt'>) => void;
}

const generateAnimalName = () => {
  const adjectives = ['Creative', 'Building', 'Playful', 'Curious', 'Friendly'];
  const animals = ['Fox', 'Penguin', 'Beaver', 'Rabbit', 'Owl'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
};

export const useGameStore = create<GameState>((set, get) => ({
  blocks: new Map(),
  currentTool: 'grass',
  userName: generateAnimalName(),
  activeUsers: new Set(),
  worldTimer: 1800, // 30 minutes
  worldId: null,

  setWorldId: (id: string | null) => set({ worldId: id }),
  setWorldTimer: (time: number) => {
    if (typeof time === 'number' && !isNaN(time)) {
      set({ worldTimer: Math.max(0, time) });
    }
  },
  setBlocks: (blocks: Map<string, Block>) => set({ blocks }),

  placeBlock: async (x: number, y: number) => {
    const key = `${x},${y}`;
    const { currentTool, userName, blocks, worldId } = get();
    console.log(`Attempting to place block: type=${currentTool}, pos=(${x},${y}), user=${userName}`);
    if (!worldId) {
      console.warn('No active world or Supabase connection');
      return;
    }
    
    // Validate coordinates
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) {
      console.warn(`Invalid coordinates: (${x}, ${y}). Must be within 0-${GRID_SIZE-1}`);
      return;
    }
    
    // Check rate limit locally
    const recentPlacements = Array.from(blocks.values())
      .filter(block => block.placedBy === userName && Date.now() - block.placedAt < 1000);
    if (recentPlacements.length >= 10) {
      console.warn('Rate limit exceeded');
      return;
    }
    
    const now = new Date().toISOString();
    
    // Optimistic update
    set({
      blocks: new Map(blocks).set(key, {
        type: currentTool,
        placedBy: userName,
        placedAt: new Date(now).getTime()
      })
    });
    
    try {
      const { error } = await supabase
        .from('blocks')
        .upsert({
          x: Math.floor(x),
          y: Math.floor(y),
          block_type: currentTool,
          placed_by: userName,
          world_id: worldId,
          placed_at: now
        }, {
          onConflict: '(x, y, world_id)',
          ignoreDuplicates: false
        });
        
      if (error) throw error;
    } catch (error: any) {
      // Rollback on error
      const newBlocks = new Map(get().blocks);
      console.error(`Block placement failed at (${x}, ${y}):`, error.message);
      newBlocks.delete(key);
      set({ blocks: newBlocks });
      console.error('Failed to place block:', error.message);
      if (error.message?.includes('FetchError')) {
        console.error('Connection to Supabase failed. Please check your network connection.');
      }
    }
  },

  setCurrentTool: (tool: BlockType) => set({ currentTool: tool }),
  
  updateBlock: (x: number, y: number, block: Omit<Block, 'placedAt'>) => {
    const key = `${x},${y}`;
    set(state => ({
      blocks: new Map(state.blocks).set(key, {
        ...block,
        placedAt: new Date().getTime()
      })
    }));
  }
}));