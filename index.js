import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// --- SUPABASE CONFIGURATION ---
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Gamitin ang Service Role Key para sa Admin override
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Connected to Supabase Cloud');

// --- HELPER FUNCTION PARA SA LOGS ---
// Ngayon, sa Supabase na rin mag-sa-save ang logs
const logActivity = async (action, user, status, details, ip) => {
    try {
        await supabase.from('security_logs').insert([
            { action, user, status, details, ip_address: ip }
        ]);
    } catch (err) {
        console.error("Log Error:", err.message);
    }
};

// --- AUTH ROUTES ---

// REGISTER ROUTE
app.post('/register', async (req, res) => {
    const { 
        studentId, name, email, password, role, campus, 
        program, yearLevel, status, age, gender, isIndigenous, isPwd 
    } = req.body;
    
    try {
        // 1. Check if user exists (using Supabase)
        const { data: existingUser } = await supabase
            .from('users')
            .select('email')
            .or(`email.eq.${email},student_id.eq.${studentId}`)
            .single();

        if (existingUser) {
            return res.status(400).json({ message: "Email or Student ID already registered" });
        }

        // 2. Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insert to Supabase 'users' table
        const { data, error } = await supabase
            .from('users')
            .insert([{
                student_id: studentId,
                name,
                email,
                password: hashedPassword,
                role: role || 'student',
                campus,
                program,
                year_level: yearLevel,
                status: status || 'active',
                age,
                gender,
                is_indigenous: isIndigenous,
                is_pwd: isPwd
            }])
            .select();

        if (error) throw error;

        await logActivity('User Registration', email, 'success', `New account created for ${name}`, req.ip);
        
        res.status(201).json({ 
            message: "Account created successfully!",
            userId: data[0].id 
        });
    } catch (error) {
        console.error("Register Error:", error.message);
        res.status(500).json({ message: "Registration failed." });
    }
});

// LOGIN ROUTE
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // 1. Get user from Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (!user || error) {
            await logActivity('Login Attempt', email, 'warning', 'User not found', req.ip);
            return res.status(404).json({ message: "User not found" });
        }
        
        // 2. Compare Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logActivity('Login Attempt', email, 'warning', 'Invalid password', req.ip);
            return res.status(401).json({ message: "Invalid credentials" });
        }

        await logActivity('User Login', email, 'success', `Login as ${user.role}`, req.ip);

        res.json({ 
            id: user.id, 
            studentId: user.student_id,
            role: user.role, 
            name: user.name, 
            email: user.email, 
            campus: user.campus,
            message: "Login successful" 
        });
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ message: "Server error" });
    }
});

// --- ADMIN & ANALYTICS ---

app.get('/admin/analytics', async (req, res) => {
    try {
        // Mas madali ang aggregations sa Supabase client
        const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: programCount } = await supabase.from('programs').select('*', { count: 'exact', head: true });
        
        // Para sa complex queries (like engagement rate), pwedeng gumamit ng .rpc() (Postgres Function)
        // Pero para sa ngayon, manual count muna:
        const { data: programs } = await supabase.from('programs').select('registered, capacity');
        const totalRegistered = programs?.reduce((acc, curr) => acc + (curr.registered || 0), 0);
        const totalCapacity = programs?.reduce((acc, curr) => acc + (curr.capacity || 0), 0);
        
        const engagementRate = totalCapacity > 0 ? ((totalRegistered / totalCapacity) * 100).toFixed(1) : 0;

        res.json({
            totalStudents: userCount,
            totalPrograms: programCount,
            engagementRate: parseFloat(engagementRate),
            // Pwede mo pang dagdagan ang ibang data rito
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE ROLE
app.put('/admin/users/:id', async (req, res) => {
    const { role, adminEmail } = req.body;
    try {
        const { data: user } = await supabase.from('users').select('name').eq('id', req.params.id).single();
        
        await supabase.from('users').update({ role }).eq('id', req.params.id);
        
        await logActivity('Role Change', adminEmail || 'Admin', 'warning', `Changed ${user.name}'s role to ${role}`, req.ip);
        res.json({ message: "User role updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`☁️ All data is now synced with Supabase Cloud`);
});