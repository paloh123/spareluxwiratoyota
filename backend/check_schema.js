const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function check() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST || 'mysql-27143ee2-suryapaloh2020-e40a.c.aivencloud.com',
            port: process.env.DB_PORT || '19673',
            user: process.env.DB_USER || 'avnadmin',
            password: process.env.DB_PASSWORD || 'genji123',
            database: process.env.DB_NAME || 'defaultdb',
            ssl: {
                rejectUnauthorized: false
            }
        });
        const [cols] = await db.query('DESCRIBE order_parts');
        console.table(cols);
        await db.end();
        process.exit(0);
    } catch (error) {
        console.error('Connection failed:', error.message);
        process.exit(1);
    }
}
check();
