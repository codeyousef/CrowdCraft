import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { supabase } from '../lib/supabase';

export const usePresence = (worldId: string | null) => {
  const userName = useGameStore(state => state.userName);
  const setActiveUsers = useGameStore(state => state.setActiveUsers);
  
  useEffect(() => {
    if (!worldId) return;
    
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
        console.log('👥 Active users:', users.size);
        
        // Subscribe to unique builders updates
        const subscription = supabase
          .from('worlds')
          .select('unique_builders')
          .eq('id', worldId)
          .single()
          .then(({ data }) => {
            if (data?.unique_builders !== undefined) {
              useGameStore.getState().setUniqueBuilders(data.unique_builders);
            }
          });
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
};