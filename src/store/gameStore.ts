import { create } from 'zustand';
import { Block, BlockType, Point } from '../types/game';
import { supabase } from '../lib/supabase';

interface GameState {
  blocks: Map<string, Block>;
  currentTool: BlockType;
  userName: string;
  activeUsers: Set<string>;
  worldTimer: number;
  setWorldId: (id: string | null) => void;
  setWorldTimer: (time: number) => void;
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
  setWorldTimer: (time: number) => set({ worldTimer: time }),

  placeBlock: async (x: number, y: number) => {
    const key = `${x},${y}`;
    const { currentTool, userName, blocks, worldId } = get();
    if (!worldId) return;
    
    // Check rate limit locally
    const recentPlacements = Array.from(blocks.values())
      .filter(block => block.placedBy === userName && Date.now() - block.placedAt < 1000);
    if (recentPlacements.length >= 10) {
      console.warn('Rate limit exceeded');
      return;
    }
    
    // Optimistic update
    set({
      blocks: new Map(blocks).set(key, {
        type: currentTool,
        placedBy: userName,
        placedAt: Date.now()
      })
    });
    
    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          x,
          y,
          block_type: currentTool,
          placed_by: userName,
          world_id: worldId
        });
        
      if (error) throw error;
    } catch (error) {
      // Rollback on error
      const newBlocks = new Map(get().blocks);
      newBlocks.delete(key);
      set({ blocks: newBlocks });
      
      if (error.message.includes('rate limit')) {
        console.warn('Server rate limit exceeded');
      } else {
        console.error('Failed to place block:', error);
      }
    }
  },

  setCurrentTool: (tool: BlockType) => set({ currentTool: tool }),
  
  updateBlock: (x: number, y: number, block: Omit<Block, 'placedAt'>) => {
    const key = `${x},${y}`;
    set(state => ({
      blocks: new Map(state.blocks).set(key, {
        ...block,
        placedAt: Date.now()
      })
    }));
  }
}));