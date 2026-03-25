const db = require('./config/db');

async function checkUsers() {
    try {
        const [rows] = await db.query('SELECT id, name, role FROM users');
        console.log('Available users:', JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

checkUsers();
