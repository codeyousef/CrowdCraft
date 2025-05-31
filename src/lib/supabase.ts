import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

// Generate a stable anonymous ID
const getAnonymousId = () => {
  let id = localStorage.getItem('anonymousId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('anonymousId', id);
  }
  return id;
};

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        'x-anonymous-id': getAnonymousId()
      }
    }
  }
);