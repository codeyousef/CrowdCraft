import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSupabaseStatus = () => {
  useEffect(() => {
    const channel = supabase.channel('system')
      .subscribe(status => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Connected to Supabase realtime');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('⚠️ Supabase connection lost, attempting to reconnect...');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
};