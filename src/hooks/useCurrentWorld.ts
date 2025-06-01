import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';
import { Block } from '../types/game';

export const useCurrentWorld = () => {
  const { setWorldId, setWorldTimes, setBlocks, worldId, initializeWorldTimer } = useGameStore();
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
        
    const loadCurrentWorld = async () => {
      if (!supabase) {
        console.error('Supabase client not initialized');
        return;
      }

      try {
        // First check if we have a world ID stored locally
        let world = null;
        const storedWorldId = localStorage.getItem('worldId');
        const shouldAutoJoin = localStorage.getItem('autoJoin') === 'true';
        
        if (!shouldAutoJoin) {
          console.log('🏠 Showing landing page - auto join disabled');
          setWorldId(null);
          return;
        }
        
        console.log('🔍 Checking stored world ID:', storedWorldId);
        
        if (storedWorldId) {
          const { data: storedWorld, error: storedError } = await supabase
            .from('worlds')
            .select('*')
            .eq('id', storedWorldId)
            .single();
          
          if (storedError) {
            console.log('❌ Stored world not found:', storedError.message);
          } else if (storedWorld) {
            // Check if world is still active
            const isActive = !storedWorld.reset_at || new Date(storedWorld.reset_at) > new Date();
            console.log('🔍 Stored world check:', { 
              id: storedWorld.id, 
              reset_at: storedWorld.reset_at,
              isActive,
              timeRemaining: storedWorld.reset_at ? Math.max(0, Math.floor((new Date(storedWorld.reset_at).getTime() - Date.now()) / 1000)) : 'no end time'
            });
            
            if (isActive) {
              world = storedWorld;
              console.log('✅ Using stored world:', { id: world.id, started: world.started_at, ends: world.reset_at });
            } else {
              console.log('⏰ Stored world has expired, will create new one');
            }
          }
        }
        
        // If no valid stored world, fetch the latest world
        if (!world) {
          console.log('🔍 No valid stored world, fetching latest from database...');
          const { data: worlds, error: fetchError } = await supabase
            .from('worlds')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
            
          if (fetchError) throw fetchError;
        
          world = worlds?.[0];
          if (world) {
            console.log('📥 Found latest world:', { id: world.id, started: world.started_at, ends: world.reset_at });
          } else {
            console.log('📭 No worlds found in database');
          }
        }
        
        // If no world exists or current world has ended, create a new one
        if (!world || (world.reset_at && new Date(world.reset_at) < new Date())) {
          // Clear localStorage when world has reset
          if (world && world.reset_at && new Date(world.reset_at) < new Date()) {
            console.log('🧹 Clearing expired world data');
            localStorage.removeItem('worldId');
            localStorage.removeItem('blocks');
            setBlocks(new Map());
          }
          
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
          // Only update if it's a different world to prevent infinite loops
          if (world.id !== worldId) {
            setWorldId(world.id);
          }
          
          console.log('✅ Loaded world:', { id: world.id, started: world.started_at, ends: world.reset_at });
          
          // Initialize or restore world timer
          await initializeWorldTimer(world.id);
          
          try {
            // Check if we have stored blocks and they're for the current world
            const storedWorldId = localStorage.getItem('worldId');
            const storedBlocks = localStorage.getItem('blocks');
            
            if (storedWorldId === world.id && storedBlocks) {
              // Use localStorage blocks if they match current world
              try {
                const blocksArray = JSON.parse(storedBlocks);
                const blockMap = new Map(blocksArray);
                console.log(`📦 Loading ${blockMap.size} blocks from localStorage...`);
                setBlocks(blockMap);
              } catch (error) {
                console.warn('Failed to parse stored blocks, loading from database...');
                // Fall back to database if localStorage is corrupted
                await loadBlocksFromDatabase(world.id);
              }
            } else {
              // Load from database if no stored blocks or world ID mismatch
              await loadBlocksFromDatabase(world.id);
            }
          } catch (error: any) {
            console.error('Failed to load blocks:', error.message);
          }
        } else {
          console.error('Invalid world data structure:', world);
        }
      } catch (error: any) {
        console.error('Failed to load current world:', error.message);
        if (error.message?.includes('FetchError')) {
          console.error('Connection to Supabase failed. Please check your environment variables and network connection.');
        }
      }
    };
    
    const loadBlocksFromDatabase = async (worldId: string) => {
      const { data: blocks, error: blocksError } = await supabase
        .from('blocks')
        .select('*')
        .eq('world_id', worldId);
      
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
        setBlocks(blockMap);
      }
    };
    
    loadCurrentWorld();
  }, []);
};