import { createClient } from '@supabase/supabase-js';

// Publishable key: safe in the browser — every table is protected by Row Level Security
// (see supabase/migrations). Can be overridden with VITE_SUPABASE_URL / VITE_SUPABASE_KEY.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://hcmbdvmqnnmlaltglndf.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_q7NUnXnYamZFEFB2h7yVzA_91-mDvsT';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
