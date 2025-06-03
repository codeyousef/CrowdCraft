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
  currentView: 'homepage' | 'world';
  setActiveUsers: (users: Set<string>) => void;
  setUniqueBuilders: (count: number) => void;
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
  setCurrentView: (view: 'homepage' | 'world') => void;
  navigateToHomepage: () => void;
  joinWorld: (worldId?: string) => Promise<void>;
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

export const useGameStore = create<GameState>((set, get) => {
  const initialStartTime = localStorage.getItem('worldStartTime');
  const initialEndTime = localStorage.getItem('worldEndTime');
  
  return {
  blocks: loadStoredBlocks(),
  currentTool: 'grass',
  userName: generateAnimalName(),
  activeUsers: new Set(),
  uniqueBuilders: 0,
  worldStartTime: initialStartTime,
  worldEndTime: initialEndTime,
  worldId: null,
  initializedWorldId: null,
  connectionStatus: 'connecting',
  currentView: 'homepage',
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setActiveUsers: (users) => set({ activeUsers: users }),
  setUniqueBuilders: (count: number) => {
    if (count !== get().uniqueBuilders) {
      console.log('🏗️ Unique builders updated:', count);
      set({ uniqueBuilders: count });
    }
  },

  setWorldId: (id: string | null) => {
    if (id) {
      localStorage.setItem('worldId', id);
      localStorage.setItem('lastWorldId', id);
    } else {
      localStorage.removeItem('worldId');
    }
    set({ worldId: id });
  },
  setWorldTimes: (startTime: string | null, endTime: string | null) => {
    
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
    const { currentTool, userName, blocks, worldId, worldStartTime, worldEndTime } = get();
    
    if (!worldId) {
      // console.warn('❌ Cannot place block: No active world');
      return;
    }
    
    // Check if block already exists
    const existingBlock = blocks.get(key);
    if (existingBlock) {
      return;
    }
    
    // Check if we need to initialize the timer
    const needsTimer = !worldStartTime || !worldEndTime || 
                      (worldEndTime && new Date(worldEndTime) <= new Date());
    
    if (needsTimer) {
      console.log('🎯 Block placed - need to initialize/restart timer for world:', worldId);
      console.log('🔍 Timer state:', { worldStartTime, worldEndTime, blocksCount: blocks.size });
      await get().initializeWorldTimer(worldId);
      console.log('✅ Timer initialization completed, checking store state...');
      const { worldStartTime: newStartTime, worldEndTime: newEndTime } = get();
      console.log('🔍 Store state after timer init:', { newStartTime, newEndTime });
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
      // console.error(`⚠️ Failed to save block to database: ${error.message}`);
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
    
    console.log('🔍 initializeWorldTimer called for world:', worldId);
    
    try {
      const { data: worldData, error: worldError } = await supabase
        .from('worlds')
        .select('started_at, reset_at')
        .eq('id', worldId)
        .single();
        
      if (worldError) throw worldError;
      
      
      // If this is the first time accessing this world (no started_at time), check localStorage first
      if (!worldData.started_at) {
        const { worldStartTime, worldEndTime } = get();
        
        // If we already have timing data in the store/localStorage for this world, use it
        if (worldStartTime && worldEndTime) {
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
          }
          // Keep existing times from localStorage
        } else {
          console.log('🆕 No timer found anywhere, creating new 15-second timer for debugging');
          const startTime = new Date().toISOString();
          const endTime = new Date(Date.now() + 15 * 1000).toISOString(); // 15 seconds for debugging
          console.log('⏰ Created timer:', { startTime, endTime });
          
          // Update world with start and end times
          const { error } = await supabase
            .from('worlds')
            .update({ 
              started_at: startTime,
              reset_at: endTime,
              total_blocks: 0,
              unique_builders: 0
            })
            .eq('id', worldId);
            
          if (error) throw error;
          
          // Set times in store and localStorage
          console.log('🔄 Setting world times in store...');
          get().setWorldTimes(startTime, endTime);
          console.log('✅ Timer set in store:', { startTime, endTime });
          localStorage.setItem('autoJoin', 'true');
          
          // Force a state update to ensure components re-render
        }
      } else {
        // Check if existing timer is still valid
        const timeRemaining = Math.max(0, Math.floor((new Date(worldData.reset_at).getTime() - Date.now()) / 1000));
        
        if (timeRemaining > 0) {
          console.log('♻️ Found valid existing timer, restoring from database');
          get().setWorldTimes(worldData.started_at, worldData.reset_at);
          console.log('⏰ Timer restored from database:', { 
            started: worldData.started_at, 
            ends: worldData.reset_at,
            timeRemaining: timeRemaining + 's'
          });
        } else {
          console.log('⏰ Existing timer has expired, creating new timer');
          const startTime = new Date().toISOString();
          const endTime = new Date(Date.now() + 30 * 1000).toISOString();
          console.log('⏰ Created new timer:', { startTime, endTime });
          
          // Update world with new start and end times
          const { error } = await supabase
            .from('worlds')
            .update({ 
              started_at: startTime,
              reset_at: endTime,
              total_blocks: 0,
              unique_builders: 0
            })
            .eq('id', worldId);
            
          if (error) throw error;
          
          // Set times in store and localStorage
          console.log('🔄 Setting new world times in store...');
          get().setWorldTimes(startTime, endTime);
          console.log('✅ New timer set in store:', { startTime, endTime });
        }
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
    localStorage.removeItem('autoJoin');
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
    // Reload to start fresh
    window.location.reload();
  },

  setCurrentView: (view: 'homepage' | 'world') => set({ currentView: view }),
  
  navigateToHomepage: () => {
    set({ currentView: 'homepage', worldId: null });
    localStorage.removeItem('autoJoin');
  },

  joinWorld: async (targetWorldId?: string) => {
    
    // Don't switch view immediately - let the components handle loading state
    
    try {
      let world = null;

      // If a specific world ID is provided, try to join that world
      if (targetWorldId) {
        const { data: targetWorld, error: targetError } = await supabase
          .from('worlds')
          .select('*')
          .eq('id', targetWorldId)
          .single();
        
        if (!targetError && targetWorld) {
          // Check if world is still active
          const isActive = !targetWorld.reset_at || new Date(targetWorld.reset_at) > new Date();
          if (isActive) {
            world = targetWorld;
          } else {
            // Clear the expired world from localStorage to avoid confusion
            localStorage.removeItem('lastWorldId');
          }
        } else if (targetError) {
          // Clear the invalid world ID from localStorage
          localStorage.removeItem('lastWorldId');
        }
      }

      // If no specific world or it's not available, find the latest world
      if (!world) {
        const { data: worlds, error: fetchError } = await supabase
          .from('worlds')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (fetchError) throw fetchError;
      
        world = worlds?.[0];
        if (world) {
          console.log('🌍 Found existing world:', { 
            id: world.id, 
            started_at: world.started_at, 
            reset_at: world.reset_at,
            hasTimer: !!(world.started_at && world.reset_at)
          });
        }
      }
      
      // If no world exists or current world has ended, create a new one
      if (!world || (world.reset_at && new Date(world.reset_at) < new Date())) {
        const { data: newWorld, error: createError } = await supabase
          .from('worlds')
          .insert([
            { 
              total_blocks: 0,
              unique_builders: 0
            }
          ])
          .select()
          .single();
          
        if (createError) throw createError;
        world = newWorld;
      }
      
      if (world && typeof world === 'object' && 'id' in world) {
        
        // Check if world already has a timer and restore it
        if (world.started_at && world.reset_at) {
          console.log('🔄 Restoring existing timer from world data...');
          get().setWorldTimes(world.started_at, world.reset_at);
          console.log('✅ Timer restored:', { started_at: world.started_at, reset_at: world.reset_at });
        }
        
        // Load blocks from database
        try {
          const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('*')
            .eq('world_id', world.id);
          
          if (blocksError) throw blocksError;
          
          if (blocks) {
            const blockMap = new Map<string, Block>();
            blocks.forEach(block => {
              blockMap.set(`${block.x},${block.y}`, {
                type: block.block_type,
                placedBy: block.placed_by,
                placedAt: new Date(block.placed_at).getTime()
              });
            });
            get().setBlocks(blockMap);
          }
        } catch (error: any) {
          console.error('Failed to load blocks:', error.message);
        }
        
        // Only NOW set the world ID and switch view after everything is loaded
        set({ worldId: world.id, currentView: 'world' });
        localStorage.setItem('worldId', world.id);
        localStorage.setItem('lastWorldId', world.id);
      }
    } catch (error: any) {
      console.error('Failed to join world:', error.message);
      // On error, go back to homepage
      set({ currentView: 'homepage', worldId: null });
      throw error;
    }
  }
}});