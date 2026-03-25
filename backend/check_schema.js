const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'monitoring_order_part'
    });
    const [cols] = await db.query('DESCRIBE order_parts');
    console.table(cols);
    process.exit(0);
}
check();
