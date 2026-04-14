import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

// Siguraduhin na tama ang configuration ng pool mo
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function seedAdmin() {
    try {
        const email = 'reinginsemanero@gmail.com';
        const password = 'gin'; // Palitan mo ito sa gusto mong password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check muna kung existing na para iwas duplicate
        const check = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (check.rows.length > 0) {
            console.log("⚠️ Admin account already exists!");
        } else {
            await pool.query(
                `INSERT INTO users (student_id, name, email, password, role, status) 
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['ADMIN001', 'System Administrator', email, hashedPassword, 'admin', 'active']
            );
            console.log("✅ Admin account seeded successfully!");
        }
    } catch (err) {
        console.error("❌ Error seeding admin:", err.message);
    } finally {
        await pool.end();
    }
}

seedAdmin();