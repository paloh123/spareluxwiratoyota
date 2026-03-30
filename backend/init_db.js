const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function initDB() {
    try {
        console.log('🔄 Initializing database...');

        // Create Users Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL, 
                role ENUM('Admin', 'SA', 'Partsman') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Users table created/verified');

        // Create Orders Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                no_order VARCHAR(50) NOT NULL UNIQUE,
                tgl_order DATE NOT NULL,
                no_rangka VARCHAR(50) NOT NULL,
                model VARCHAR(100) NOT NULL,
                no_polisi VARCHAR(20) NOT NULL,
                nama_pelanggan VARCHAR(150) NOT NULL,
                status ENUM('On Order', 'Partial', 'Completed', 'On Delivery', 'Overdue') NOT NULL DEFAULT 'On Order',
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )
        `);
        console.log('✅ Orders table created/verified');

        // Create Order Parts Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS order_parts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                no_part VARCHAR(50) NOT NULL,
                nama_part VARCHAR(150) NOT NULL,
                qty INT NOT NULL,
                etd DATE NOT NULL,
                eta DATE NOT NULL,
                ata DATE NULL,
                status_part ENUM('On Order', 'Received', 'Partial') NOT NULL DEFAULT 'On Order',
                sisa INT NOT NULL DEFAULT 0,
                suplai INT NOT NULL DEFAULT 0,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                UNIQUE KEY uk_order_part (order_id, no_part)
            )
        `);
        console.log('✅ Order Parts table created/verified');

        // Seed Users
        const hashedPassword = await bcrypt.hash('password123', 10);
        const users = [
            ['Super Admin', 'admin@toyota.dealer', hashedPassword, 'Admin'],
            ['Service Advisor', 'sa@toyota.dealer', hashedPassword, 'SA'],
            ['Partsman User', 'partsman@toyota.dealer', hashedPassword, 'Partsman'],
        ];

        for (const [name, email, password, role] of users) {
             await db.query(
                'INSERT IGNORE INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                [name, email, password, role]
            );
            console.log(`✅ Seeded user: ${email} (${role})`);
        }

        console.log('\n🎉 Database Initialization Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Initialization failed:', err.message);
        process.exit(1);
    }
}

initDB();
