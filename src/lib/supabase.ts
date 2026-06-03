/**
 * Supabase client — only created when both URL and anon key are set.
 * When null, the app runs in local-only mode (no auth, no sync) so it
 * still works with zero backend configuration.
 */
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabase: SupabaseClient | null =
  config.supabaseUrl && config.supabaseAnonKey
    ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

/** True when auth + cloud sync are available. */
export function isCloudEnabled(): boolean {
  return supabase !== null;
}
