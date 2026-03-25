/**
 * Script untuk reset & seed ulang data user ke database
 * Jalankan: node seed.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seed() {
    try {
        console.log('🔄 Connecting to database...');

        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('✅ Password hashed:', hashedPassword);

        // Delete existing users first
        await db.query('DELETE FROM users');
        console.log('🗑️  Cleared existing users');

        // Insert fresh users
        const users = [
            ['Super Admin', 'admin@toyota.dealer', hashedPassword, 'Admin'],
            ['Service Advisor', 'sa@toyota.dealer', hashedPassword, 'SA'],
            ['Partsman User', 'partsman@toyota.dealer', hashedPassword, 'Partsman'],
        ];

        for (const [name, email, password, role] of users) {
            await db.query(
                'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, password, role]
            );
            console.log(`✅ Created user: ${email} (${role})`);
        }

        console.log('\n🎉 Seed complete! Login with:');
        console.log('   Email: admin@toyota.dealer');
        console.log('   Password: password123');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
        process.exit(1);
    }
}

seed();
