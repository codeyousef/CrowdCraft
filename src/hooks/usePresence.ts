import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const usePresence = (worldId: string | null) => {
  const userName = useGameStore(state => state.userName);
  const setActiveUsers = useGameStore(state => state.setActiveUsers);
  const setUniqueBuilders = useGameStore(state => state.setUniqueBuilders);
  
  useEffect(() => {
    if (!worldId) return;
    
    // Fetch unique builders count for this world
    const fetchUniqueBuilders = async () => {
      try {
        const { data, error } = await supabase
          .from('blocks')
          .select('placed_by')
          .eq('world_id', worldId);
          
        if (error) throw error;
        
        const uniqueUsers = new Set(data?.map(block => block.placed_by) || []);
        setUniqueBuilders(uniqueUsers.size);
      } catch (error) {
        console.error('Failed to fetch unique builders:', error);
      }
    };
    
    fetchUniqueBuilders();
    
    const channel = supabase.channel(`presence:${worldId}`, {
      config: {
        presence: {
          key: userName
        }
      }
    });
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = new Set(Object.keys(state));
        
        // Update active users count
        setActiveUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        console.log('✨ User joined:', key);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('👋 User left:', key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [worldId, userName]);
  
  // Also listen for new blocks to update unique builders count
  useEffect(() => {
    if (!worldId) return;
    
    const subscription = supabase
      .channel('unique-builders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'blocks',
        filter: `world_id=eq.${worldId}`
      }, async () => {
        // Refetch unique builders when new blocks are placed
        try {
          const { data, error } = await supabase
            .from('blocks')
            .select('placed_by')
            .eq('world_id', worldId);
            
          if (error) throw error;
          
          const uniqueUsers = new Set(data?.map(block => block.placed_by) || []);
          setUniqueBuilders(uniqueUsers.size);
        } catch (error) {
          console.error('Failed to update unique builders:', error);
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [worldId, setUniqueBuilders]);
};