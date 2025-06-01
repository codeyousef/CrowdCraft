import { create } from 'zustand';
import { Block, BlockType, Point, GRID_SIZE } from '../types/game';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';

interface GameState {
  blocks: Map<string, Block>;
  currentTool: BlockType;
  userName: string;
  activeUsers: Set<string>;
  worldStartTime: string | null;
  worldEndTime: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  setActiveUsers: (users: Set<string>) => void;
  setWorldId: (id: string | null) => void;
  setWorldTimes: (startTime: string | null, endTime: string | null) => void;
  setBlocks: (blocks: Map<string, Block>) => void;
  worldId: string | null;
  placeBlock: (x: number, y: number) => void;
  setCurrentTool: (tool: BlockType) => void;
  updateBlock: (x: number, y: number, block: Omit<Block, 'placedAt'>) => void;
  setConnectionStatus: (status: GameState['connectionStatus']) => void;
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
  worldStartTime: null,
  worldEndTime: null,
  worldId: null,
  connectionStatus: 'connecting',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setActiveUsers: (users) => set({ activeUsers: users }),

  setWorldId: (id: string | null) => set({ worldId: id }),
  setWorldTimes: (startTime: string | null, endTime: string | null) => set({ 
    worldStartTime: startTime,
    worldEndTime: endTime
  }),
  setBlocks: (blocks: Map<string, Block>) => set({ blocks }),

  placeBlock: async (x: number, y: number) => {
    const key = `${x},${y}`;
    const { currentTool, userName, blocks, worldId, worldStartTime } = get();
    
    console.log('🎮 Block placement attempt:', {
      coordinates: { x, y },
      tool: currentTool,
      user: userName,
      worldId
    });
    
    if (!worldId) {
      console.warn('❌ Cannot place block: No active world');
      return;
    }
    
    // Check if block already exists
    const existingBlock = blocks.get(key);
    if (existingBlock) {
      console.log('ℹ️ Block already exists at:', { x, y });
      return;
    }
    
    const now = Date.now();
    
    // If this is the first block, start the timer
    if (!worldStartTime) {
      const startTime = new Date().toISOString();
      const endTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      
      try {
        const { error } = await supabase
          .from('worlds')
          .update({ 
            started_at: startTime,
            reset_at: endTime
          })
          .eq('id', worldId);
          
        if (error) throw error;
        get().setWorldTimes(startTime, endTime);
      } catch (error: any) {
        console.error('Failed to update world times:', error.message);
      }
    }
    
    // Place block locally first (optimistic update)
    set({
      blocks: new Map(blocks).set(key, {
        type: currentTool,
        placedBy: userName,
        placedAt: now
      })
    });
    
    // Try to save to database
    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          x: Math.floor(x),
          y: Math.floor(y),
          block_type: currentTool,
          placed_by: userName,
          world_id: worldId,
          placed_at: new Date(now).toISOString()
        });
        
      if (error) throw error;
      console.log(`✅ Successfully saved ${currentTool} at (${x}, ${y}) to database`);
    } catch (error: any) {
      console.error(`⚠️ Failed to save block to database: ${error.message}`);
      console.log('Block remains in local state only');
      // Don't rollback - keep the local block even if database save fails
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