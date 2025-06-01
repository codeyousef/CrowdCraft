import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useGameStore } from '../store/gameStore';

export const useSupabaseStatus = () => {
  const setConnectionStatus = useGameStore(state => state.setConnectionStatus);

  useEffect(() => {
    const channel = supabase.channel('system')
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected');
          console.log('✅ Connected to Supabase realtime');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setConnectionStatus('disconnected');
          console.warn('⚠️ Supabase connection lost, attempting to reconnect...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setConnectionStatus('disconnected');
    };
  }, []);
};