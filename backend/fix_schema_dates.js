const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'monitoring_order_part'
        });

        console.log('Altering order_parts table...');
        await db.query('ALTER TABLE order_parts MODIFY COLUMN etd DATE NULL');
        await db.query('ALTER TABLE order_parts MODIFY COLUMN eta DATE NULL');

        console.log('✅ Schema updated successfully');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
        process.exit(1);
    }
}
migrate();
