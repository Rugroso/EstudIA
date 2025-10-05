import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,   // usa window.localStorage en web
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
export { supabase };

