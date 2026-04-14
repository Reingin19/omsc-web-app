import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfmlwrmjfhpftdcovmnb.supabase.co';
const supabaseKey = 'sb_publishable_2hNyVoaPdfCEDCp-aIcOHA_RIjCHhny';

export const supabase = createClient(supabaseUrl, supabaseKey);