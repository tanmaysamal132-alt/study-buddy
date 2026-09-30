import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://hrufzffmsdtkbesqhqbk.supabase.co';
export const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_9gyirUgXjXrs3w-hUaW3Iw_UTyWk5tB';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const targetUrl = url || DEFAULT_SUPABASE_URL;
  const targetKey = key || DEFAULT_SUPABASE_ANON_KEY;

  if (!targetUrl || !targetKey) return null;

  try {
    if (!supabaseInstance) {
      supabaseInstance = createClient(targetUrl, targetKey);
    }
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error);
    return null;
  }
}

export function resetSupabaseClient(url: string, key: string): SupabaseClient | null {
  try {
    supabaseInstance = createClient(url, key);
    return supabaseInstance;
  } catch (error) {
    console.warn('Failed to reset Supabase client:', error);
    return null;
  }
}
