const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setup() {
    try {
        console.log('🔄 Menghubungkan ke Aiven MySQL...');
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });

        console.log('✅ Terhubung. Menghapus tabel lama (orders & order_parts)...');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DROP TABLE IF EXISTS order_parts');
        await connection.query('DROP TABLE IF EXISTS orders');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ Membuat ulang tabel "orders" dengan 27 Kolom sesuai template Excel...');
        await connection.query(`
            CREATE TABLE orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                -- 27 KOLOM EXCEL
                no_order VARCHAR(50) NOT NULL,
                tgl_order DATE,
                jenis_order VARCHAR(50),
                no_part VARCHAR(50) NOT NULL,
                nama_part VARCHAR(255),
                qty INT DEFAULT 0,
                tipe VARCHAR(50),
                keterangan TEXT,
                no_rangka VARCHAR(50),
                model VARCHAR(100),
                tipe_mobil VARCHAR(100),
                hp_contact VARCHAR(100),
                etd DATE,
                eta DATE,
                status_order VARCHAR(50),
                sisa INT DEFAULT 0,
                delivery VARCHAR(100),
                suplai INT DEFAULT 0,
                kedatangan_1 DATE,
                kedatangan_2 DATE,
                kedatangan_3 DATE,
                kedatangan_4 DATE,
                kedatangan_5 DATE,
                last_ata DATE,
                lead_time_order INT DEFAULT 0,
                lead_time_delivery INT DEFAULT 0,
                umur_order INT DEFAULT 0,
                
                -- KOLOM TAMBAHAN UNTUK UI & TRACKING
                no_polisi VARCHAR(50) DEFAULT '',
                nama_pelanggan VARCHAR(255) DEFAULT '',
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                
                -- UNIQUE KEY UNTUK BULK UPSERT (No Order + No Part)
                UNIQUE KEY uk_order_part (no_order, no_part),
                INDEX idx_no_order (no_order),
                INDEX idx_tgl_order (tgl_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('🎉 SCHEMA BERHASIL DIPERBARUI! Database siap menerima 27 kolom data.');
        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR saat setting up database:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    }
}

setup();
