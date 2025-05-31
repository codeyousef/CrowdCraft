import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';
import { useGameStore } from '../store/gameStore';

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Sign in anonymously if not already signed in
const signInAnonymously = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const setUser = useGameStore.getState().setUser;
  
  if (!session) {
    const { data: { user }, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Failed to sign in anonymously:', error);
      return;
    }
    setUser(user);
  } else {
    setUser(session.user);
  }
};

signInAnonymously();