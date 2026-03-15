import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY ausentes no front-end.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
