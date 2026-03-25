const db = require('./config/db');

async function fixSchema() {
    try {
        console.log('Attempting to add unique key to order_parts...');
        // First check if it exists
        const [rows] = await db.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.statistics 
            WHERE table_name = 'order_parts' 
            AND index_name = 'uk_order_part'
        `);

        if (rows[0].count === 0) {
            await db.query("ALTER TABLE order_parts ADD UNIQUE KEY uk_order_part (order_id, no_part)");
            console.log('Unique key uk_order_part added successfully.');
        } else {
            console.log('Unique key uk_order_part already exists.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Failed to update schema:', error.message);
        process.exit(1);
    }
}

fixSchema();
