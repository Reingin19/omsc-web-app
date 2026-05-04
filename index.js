import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const app = express();

// --- MIDDLEWARE ---
app.use(cors({
    origin: '*', // Mas safe kung specific Vercel URL mo ilalagay mo rito later
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// --- SUPABASE CONFIG ---
// Gagamit tayo ng fallback sa standard names para sa Vercel deployment
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Admin Client (Bypasses RLS - for logs and creating auth accounts)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Anon Client (Follows RLS - for generating user sessions)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// --- LOGGER HELPER ---
const logActivity = async (action, userEmail, status, details, req) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
        await supabase.from('security_logs').insert([
            { action, user_email: userEmail, status, details, ip_address: ip }
        ]);
    } catch (err) {
        console.error("🔥 Logger Error:", err.message);
    }
};

// --- ROUTES ---

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    const { 
        studentId, name, email, password, role, campus, 
        program, yearLevel, status, age, gender, isIndigenous, isPwd 
    } = req.body;
    
    const cleanEmail = email?.trim().toLowerCase();
    const cleanStudentId = studentId?.trim();

    try {
        // Check if user exists
        const { data: existing } = await supabase
            .from('users')
            .select('email')
            .or(`email.eq.${cleanEmail},student_id.eq.${cleanStudentId}`);

        if (existing && existing.length > 0) {
            return res.status(400).json({ message: "Email or Student ID already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Save to your public.users table
        const { data, error: dbError } = await supabase
            .from('users')
            .insert([{
                student_id: cleanStudentId,
                name: name.trim(),
                email: cleanEmail,
                password: hashedPassword,
                role: role || 'student',
                campus, program, year_level: yearLevel,
                status: status || 'active',
                age, gender, is_indigenous: isIndigenous, is_pwd: isPwd
            }])
            .select();

        if (dbError) throw dbError;

        // Create Supabase Auth Account (Para may session sila)
        await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: { name: name.trim(), role: role || 'student' }
        });

        await logActivity('User Registration', cleanEmail, 'success', `New account: ${name}`, req);
        res.status(201).json({ message: "Account created!", userId: data[0].id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// 2. LOGIN (The "Fix-it-all" Route)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    try {
        // Find user in your DB
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        // Get or Create Auth Session
        let { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
            email: cleanEmail,
            password: password,
        });

        // If no auth account yet (for old users), create it now
        if (authError) {
            await supabase.auth.admin.createUser({
                email: cleanEmail,
                password: password,
                email_confirm: true,
                user_metadata: { name: user.name, role: user.role }
            });
            
            const retry = await supabaseAnon.auth.signInWithPassword({
                email: cleanEmail,
                password: password,
            });
            authData = retry.data;
        }

        await logActivity('User Login', cleanEmail, 'success', `Logged in as ${user.role}`, req);

        res.json({ 
            id: user.id, 
            role: user.role, 
            name: user.name, 
            email: user.email,
            campus: user.campus,
            access_token: authData?.session?.access_token || null,
            refresh_token: authData?.session?.refresh_token || null
        });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// 3. LOGS (For Admin Dashboard)
app.get('/api/admin/security-logs', async (req, res) => {
    const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// --- VERCEL EXPORT ---
if (process.env.NODE_ENV !== 'production') {
    app.listen(3001, () => console.log('🚀 Local dev on port 3001'));
}

export default app;