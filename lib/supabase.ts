// lib/supabase.ts
import { Platform } from 'react-native';

let m: typeof import('./supabase.web'); 

if (Platform.OS === 'ios' || Platform.OS === 'android') {
  m = require('./supabase.native');
} else {
  // web/desktop/SSR
  m = require('./supabase.web');
}

export const supabase = m.supabase;
