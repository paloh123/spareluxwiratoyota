/**
 * Migration: Tambah kolom untuk fitur Ready Installation
 * 
 * Kolom baru:
 *   - sa             VARCHAR(100)  -- Nama Service Advisor
 *   - foreman        VARCHAR(100)  -- Nama Foreman
 *   - status_pemasangan ENUM       -- BELUM_DIPASANG | SELESAI
 *   - status_gudang  ENUM          -- BELUM_DIAMBIL | DIAMBIL
 *   - tanggal_part_datang DATE     -- Tanggal part tiba (shortcut alias last_ata)
 * 
 * Jalankan: node backend/migrate_ready_installation.js
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrate() {
    let connection;
    try {
        console.log('🔄 Menghubungkan ke database...');
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: { rejectUnauthorized: false }
        });

        console.log('✅ Terhubung. Menjalankan migrasi kolom Ready Installation...');

        const alterations = [
            {
                name: 'sa',
                sql: `ALTER TABLE orders ADD COLUMN sa VARCHAR(100) DEFAULT '' COMMENT 'Service Advisor'`
            },
            {
                name: 'foreman',
                sql: `ALTER TABLE orders ADD COLUMN foreman VARCHAR(100) DEFAULT '' COMMENT 'Foreman / Kepala Regu'`
            },
            {
                name: 'status_pemasangan',
                sql: `ALTER TABLE orders ADD COLUMN status_pemasangan ENUM('BELUM_DIPASANG','SELESAI') NOT NULL DEFAULT 'BELUM_DIPASANG' COMMENT 'Status pemasangan part oleh teknisi'`
            },
            {
                name: 'status_gudang',
                sql: `ALTER TABLE orders ADD COLUMN status_gudang ENUM('BELUM_DIAMBIL','DIAMBIL') NOT NULL DEFAULT 'BELUM_DIAMBIL' COMMENT 'Status pengambilan part dari gudang'`
            },
            {
                name: 'tanggal_part_datang',
                sql: `ALTER TABLE orders ADD COLUMN tanggal_part_datang DATE DEFAULT NULL COMMENT 'Tanggal part datang (ATA aktual)'`
            },
        ];

        for (const alt of alterations) {
            try {
                await connection.query(alt.sql);
                console.log(`  ✅ Kolom '${alt.name}' berhasil ditambahkan.`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`  ⚠️  Kolom '${alt.name}' sudah ada — dilewati.`);
                } else {
                    throw err;
                }
            }
        }

        // Tambah index untuk performa query
        try {
            await connection.query(`ALTER TABLE orders ADD INDEX idx_status_order_install (status_order, status_pemasangan, status_gudang)`);
            console.log('  ✅ Index performa ditambahkan.');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('  ⚠️  Index sudah ada — dilewati.');
            } else {
                console.warn('  ⚠️  Gagal membuat index (non-fatal):', err.message);
            }
        }

        console.log('\n🎉 MIGRASI SELESAI! Fitur Ready Installation siap digunakan.');
        process.exit(0);
    } catch (error) {
        console.error('❌ ERROR migrasi:', error.message);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
