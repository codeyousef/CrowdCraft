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
  console.log('🏪 Initial store state from localStorage:', { initialStartTime, initialEndTime });
  
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
    console.log('🕐 Setting world times:', { 
      startTime, 
      endTime,
      remaining: endTime ? Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)) : 'no end time',
      willTriggerUpdate: startTime !== get().worldStartTime || endTime !== get().worldEndTime
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
    
    // Yield control at start
    await new Promise(resolve => setTimeout(resolve, 0));
    
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
          
          // Yield control before database update
          await new Promise(resolve => setTimeout(resolve, 0));
          
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
          get().setWorldTimes(startTime, endTime);
          localStorage.setItem('autoJoin', 'true');
          console.log('⏰ Started world timer:', { startTime, endTime });
          
          // Force a state update to ensure components re-render
          console.log('🔄 Forcing timer state update...');
        }
      } else {
        // Use existing times from database
        console.log('♻️ Found existing timer, restoring from database');
        
        // Check if the world has already expired
        const timeRemaining = Math.max(0, Math.floor((new Date(worldData.reset_at).getTime() - Date.now()) / 1000));
        if (timeRemaining <= 0) {
          console.log('⚠️ WARNING: Restoring timer for already expired world, world reset should trigger soon');
        }
        
        get().setWorldTimes(worldData.started_at, worldData.reset_at);
        console.log('⏰ Timer restored from database:', { 
          started: worldData.started_at, 
          ends: worldData.reset_at,
          remaining: timeRemaining
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
    console.log('🌍 joinWorld called with:', { targetWorldId });
    
    // Set loading state immediately to switch view
    set({ currentView: 'world' });
    
    // Use setTimeout to make the heavy operations non-blocking
    await new Promise(resolve => setTimeout(resolve, 0));
    
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
            console.log('✅ Joining specific world:', { id: world.id, started: world.started_at, ends: world.reset_at });
          } else {
            console.log('⏰ Requested world has expired, will create new world:', { 
              id: targetWorld.id, 
              reset_at: targetWorld.reset_at,
              expired: targetWorld.reset_at ? new Date(targetWorld.reset_at) <= new Date() : false
            });
            // Clear the expired world from localStorage to avoid confusion
            localStorage.removeItem('lastWorldId');
          }
        } else if (targetError) {
          console.log('❌ Failed to find requested world:', targetError.message);
          // Clear the invalid world ID from localStorage
          localStorage.removeItem('lastWorldId');
        }
      }

      // Yield control before database query
      await new Promise(resolve => setTimeout(resolve, 0));

      // If no specific world or it's not available, find the latest world
      if (!world) {
        console.log('🔍 Finding latest world...');
        const { data: worlds, error: fetchError } = await supabase
          .from('worlds')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (fetchError) throw fetchError;
      
        world = worlds?.[0];
        if (world) {
          console.log('📥 Found latest world:', { id: world.id, started: world.started_at, ends: world.reset_at });
        }
      }
      
      // Yield control before potential world creation
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // If no world exists or current world has ended, create a new one
      if (!world || (world.reset_at && new Date(world.reset_at) < new Date())) {
        console.log('🆕 Creating new world...');
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
        console.log('✅ Created new world:', { id: world.id });
      }
      
      if (world && typeof world === 'object' && 'id' in world) {
        console.log('✅ Joined world:', { id: world.id, started: world.started_at, ends: world.reset_at });
        console.log('🕐 About to initialize world timer...');
        
        // Yield control before timer initialization
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Initialize world timer FIRST before setting world ID
        await get().initializeWorldTimer(world.id);
        
        console.log('🕐 World timer initialization completed');
        
        // Now set the world ID
        set({ worldId: world.id });
        localStorage.setItem('worldId', world.id);
        localStorage.setItem('lastWorldId', world.id);
        
        // Yield control before loading blocks
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // Load blocks from database
        try {
          const { data: blocks, error: blocksError } = await supabase
            .from('blocks')
            .select('*')
            .eq('world_id', world.id);
          
          if (blocksError) throw blocksError;
          
          if (blocks) {
            const blockMap = new Map<string, Block>();
            console.log(`📦 Loading ${blocks.length} blocks from database...`);
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
      }
    } catch (error: any) {
      console.error('Failed to join world:', error.message);
      // On error, go back to homepage
      set({ currentView: 'homepage', worldId: null });
      throw error;
    }
  }
}});