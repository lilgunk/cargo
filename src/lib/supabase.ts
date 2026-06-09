import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hoxvmruvbybngaxowlmw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_bsajf0zLAmM2L2Ay2jFXoQ_iWi0FbyY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
