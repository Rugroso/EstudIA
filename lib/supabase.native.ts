import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

const supabase = createClient(
  process.env.EXPO_SUPABASE_URL!,
  process.env.EXPO_SUPABASE_PUBLIC_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storage: AsyncStorage,
    },
  }
);
export { supabase };

