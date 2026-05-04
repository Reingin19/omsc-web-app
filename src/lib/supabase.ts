import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yfmlwrmjfhpftdcovmnb.supabase.co';
// Gamit na ang tamang Anon Key na binigay mo
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmbWx3cm1qZmhwZnRkY292bW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NDYxMDcsImV4cCI6MjA4OTIyMjEwN30.pCZEbczvGVWmg-w43xqLC0IZMUurn414ineO7IauBIs'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true, // Mahalaga ito para hindi mag-expire agad ang session
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * LogActivity Function
 * Ginagamit para i-record ang mga mahahalagang actions sa system.
 */
export const logActivity = async (supabaseClient: any, {
  action,
  details,
  status = 'success'
}: {
  action: string;
  details: string;
  status?: 'success' | 'warning' | 'danger';
}) => {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    await supabaseClient.from('security_logs').insert([{
      user_email: user?.email || 'Anonymous',
      role: user?.user_metadata?.role || 'Guest',
      action,
      details,
      status,
      ip_address: 'Client-Side',
    }]);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};