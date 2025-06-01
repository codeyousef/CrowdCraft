import { create } from 'zustand';
import { Block, BlockType, Point, GRID_SIZE } from '../types/game';
import { supabase } from '../lib/supabase';
import { nanoid } from 'nanoid';

interface GameState {
  blocks: Map<string, Block>;
  currentTool: BlockType;
  userName: string;
  activeUsers: Set<string>;
  uniqueBuilders: number;
  worldStartTime: string | null;
  worldEndTime: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  initializedWorldId: string | null;
  setActiveUsers: (users: Set<string>) => void;
  setWorldId: (id: string | null) => void;
  setWorldTimes: (startTime: string | null, endTime: string | null) => void;
  setBlocks: (blocks: Map<string, Block>) => void;
  worldId: string | null;
  placeBlock: (x: number, y: number) => void;
  setCurrentTool: (tool: BlockType) => void;
  updateBlock: (x: number, y: number, block: Omit<Block, 'placedAt'>) => void;
  setConnectionStatus: (status: GameState['connectionStatus']) => void;
  initializeWorldTimer: (worldId: string) => Promise<void>;
  resetForDevelopment: () => void;
}

const generateAnimalName = () => {
  const adjectives = ['Creative', 'Building', 'Playful', 'Curious', 'Friendly'];
  const animals = ['Fox', 'Penguin', 'Beaver', 'Rabbit', 'Owl'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${animals[Math.floor(Math.random() * animals.length)]}`;
};

const loadStoredBlocks = (): Map<string, Block> => {
  try {
    const storedBlocks = localStorage.getItem('blocks');
    if (storedBlocks) {
      const blocksArray = JSON.parse(storedBlocks);
      return new Map(blocksArray);
    }
  } catch (error) {
    console.warn('Failed to load stored blocks:', error);
  }
  return new Map();
};

export const useGameStore = create<GameState>((set, get) => ({
  blocks: loadStoredBlocks(),
  currentTool: 'grass',
  userName: generateAnimalName(),
  activeUsers: new Set(),
  uniqueBuilders: 0,
  worldStartTime: localStorage.getItem('worldStartTime'),
  worldEndTime: localStorage.getItem('worldEndTime'),
  worldId: localStorage.getItem('worldId'),
  initializedWorldId: null,
  connectionStatus: 'connecting',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setActiveUsers: (users) => set({ activeUsers: users }),
  setUniqueBuilders: (count: number) => set({ uniqueBuilders: count }),
  setUniqueBuilders: (count: number) => {
    if (count !== get().uniqueBuilders) {
      console.log('🏗️ Unique builders updated:', count);
      set({ uniqueBuilders: count });
    }
  },

  setWorldId: (id: string | null) => {
    if (id) {
      localStorage.setItem('worldId', id);
    } else {
      localStorage.removeItem('worldId');
    }
    set({ worldId: id });
  },
  setWorldTimes: (startTime: string | null, endTime: string | null) => {
    console.log('🕐 Setting world times:', { 
      startTime, 
      endTime,
      remaining: endTime ? Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)) : 'no end time'
    });
    
    // Persist world times to localStorage
    if (startTime && endTime) {
      localStorage.setItem('worldStartTime', startTime);
      localStorage.setItem('worldEndTime', endTime);
    } else {
      localStorage.removeItem('worldStartTime');
      localStorage.removeItem('worldEndTime');
    }
    
    set({ 
      worldStartTime: startTime,
      worldEndTime: endTime
    });
  },
  setBlocks: (blocks: Map<string, Block>) => {
    // Persist blocks to localStorage
    const blocksArray = Array.from(blocks.entries());
    localStorage.setItem('blocks', JSON.stringify(blocksArray));
    set({ blocks });
  },

  placeBlock: async (x: number, y: number) => {
    const key = `${x},${y}`;
    const { currentTool, userName, blocks, worldId } = get();
    
    if (!worldId) {
      console.warn('❌ Cannot place block: No active world');
      return;
    }
    
    // Check if block already exists
    const existingBlock = blocks.get(key);
    if (existingBlock) {
      return;
    }
    
    const now = Date.now();
    
    // Place block locally first (optimistic update)
    const newBlocks = new Map(blocks).set(key, {
      type: currentTool,
      placedBy: userName,
      placedAt: now
    });
    // Persist to localStorage
    const blocksArray = Array.from(newBlocks.entries());
    localStorage.setItem('blocks', JSON.stringify(blocksArray));
    set({ blocks: newBlocks });
    
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
    } catch (error: any) {
      console.error(`⚠️ Failed to save block to database: ${error.message}`);
      // Don't rollback - keep the local block even if database save fails
    }
  },

  setCurrentTool: (tool: BlockType) => set({ currentTool: tool }),
  
  updateBlock: (x: number, y: number, block: Omit<Block, 'placedAt'>) => {
    const key = `${x},${y}`;
    set(state => {
      const newBlocks = new Map(state.blocks).set(key, {
        ...block,
        placedAt: new Date().getTime()
      });
      // Persist to localStorage
      const blocksArray = Array.from(newBlocks.entries());
      localStorage.setItem('blocks', JSON.stringify(blocksArray));
      return { blocks: newBlocks };
    });
  },

  initializeWorldTimer: async (worldId: string) => {
    const { initializedWorldId } = get();
    
    // Prevent multiple initializations for the same world
    if (initializedWorldId === worldId) {
      console.log('⏭️ World timer already initialized for:', worldId);
      return;
    }
    
    try {
      console.log('🔍 initializeWorldTimer called for world:', worldId);
      const { data: worldData, error: worldError } = await supabase
        .from('worlds')
        .select('started_at, reset_at')
        .eq('id', worldId)
        .single();
        
      if (worldError) throw worldError;
      
      console.log('📊 World data from database:', worldData);
      
      // If this is the first time accessing this world (no started_at time), check localStorage first
      if (!worldData.started_at) {
        const { worldStartTime, worldEndTime } = get();
        
        // If we already have timing data in the store/localStorage for this world, use it
        if (worldStartTime && worldEndTime) {
          console.log('🔄 No timer in database but found in localStorage, updating database...');
          const { error } = await supabase
            .from('worlds')
            .update({ 
              started_at: worldStartTime,
              reset_at: worldEndTime
            })
            .eq('id', worldId);
            
          if (error) {
            console.error('Failed to update database with localStorage times:', error);
          } else {
            console.log('✅ Updated database with localStorage timer data');
          }
          // Keep existing times from localStorage
        } else {
          console.log('🆕 No timer found anywhere, creating new 30-minute timer');
          const startTime = new Date().toISOString();
          const endTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
          
          const { error } = await supabase
            .from('worlds')
            .update({ 
              started_at: startTime,
              reset_at: endTime
            })
            .eq('id', worldId);
            
          if (error) throw error;
          get().setWorldTimes(startTime, endTime);
          console.log('⏰ Started world timer:', { startTime, endTime });
        }
      } else {
        // Use existing times from database
        console.log('♻️ Found existing timer, restoring from database');
        get().setWorldTimes(worldData.started_at, worldData.reset_at);
        console.log('⏰ Timer restored from database:', { 
          started: worldData.started_at, 
          ends: worldData.reset_at,
          remaining: Math.max(0, Math.floor((new Date(worldData.reset_at).getTime() - Date.now()) / 1000))
        });
      }
      
      // Mark this world as initialized
      set({ initializedWorldId: worldId });
    } catch (error: any) {
      console.error('Failed to initialize world timer:', error.message);
    }
  },

  resetForDevelopment: () => {
    localStorage.removeItem('worldId');
    localStorage.removeItem('blocks');
    localStorage.removeItem('worldStartTime');
    localStorage.removeItem('worldEndTime');
    set({
      worldId: null,
      worldStartTime: null,
      worldEndTime: null,
      blocks: new Map(),
      initializedWorldId: null
    });
    console.log('🔄 Development reset: cleared local storage and state');
  }
}));