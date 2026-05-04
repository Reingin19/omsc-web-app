import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const app = express();

// --- MIDDLEWARE ---
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));

// --- SUPABASE CONFIG ---
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

// Admin Client
const supabase = createClient(supabaseUrl, supabaseServiceKey);
// Anon Client
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// --- LOGGER HELPER (Optimized for Serverless) ---
const logActivity = async (action, userEmail, status, details, req) => {
    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';
        // Hindi natin gagamitin ang 'await' dito para hindi ma-delay ang response sa user
        supabase.from('security_logs').insert([
            { action, user_email: userEmail, status, details, ip_address: ip }
        ]).then(({ error }) => {
            if (error) console.error("🔥 Logger DB Error:", error.message);
        });
    } catch (err) {
        console.error("🔥 Logger Runtime Error:", err.message);
    }
};

// --- ROUTES ---

// Health Check (Para ma-test kung gising ang backend)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "OK", message: "Backend is running" });
});

// 1. REGISTER
app.post('/api/register', async (req, res) => {
    const { 
        studentId, name, email, password, role, campus, 
        program, yearLevel, status, age, gender, isIndigenous, isPwd 
    } = req.body;
    
    const cleanEmail = email?.trim().toLowerCase();
    const cleanStudentId = studentId?.trim();

    try {
        const { data: existing } = await supabase
            .from('users')
            .select('email')
            .or(`email.eq.${cleanEmail},student_id.eq.${cleanStudentId}`);

        if (existing && existing.length > 0) {
            return res.status(400).json({ message: "Email or Student ID already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

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

        await supabase.auth.admin.createUser({
            email: cleanEmail,
            password: password,
            email_confirm: true,
            user_metadata: { name: name.trim(), role: role || 'student' }
        });

        logActivity('User Registration', cleanEmail, 'success', `New account: ${name}`, req);
        res.status(201).json({ message: "Account created!", userId: data[0].id });
    } catch (error) {
        console.error("Registration Error:", error.message);
        res.status(500).json({ message: error.message });
    }
});

// 2. LOGIN
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const cleanEmail = email?.trim().toLowerCase();

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .maybeSingle();

        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        let { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
            email: cleanEmail,
            password: password,
        });

        if (authError) {
            // Auto-create auth account kung wala pa
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

        logActivity('User Login', cleanEmail, 'success', `Logged in as ${user.role}`, req);

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
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// 3. LOGS
app.get('/api/admin/security-logs', async (req, res) => {
    const { data, error } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// --- VERCEL EXPORT (CRITICAL FIX) ---
// Sa Vercel, kailangan i-export ang app mismo
export default app;