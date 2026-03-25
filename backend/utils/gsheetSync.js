const axios = require('axios');
const { parse } = require('csv-parse/sync');
const db = require('../config/db');

const GSHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSb4VFJNhlBzRs3Sl4DQ7gBO9iNYIOpVdgM2IgGCsrY8rvUFjQLfgk41Scw481JYhBwnUwZNoy2KwaP/pub?gid=1025171610&single=true&output=csv';

async function syncWithGSheet() {
    console.log('--- STARTING OPTIMIZED AXIOS SYNC (65k+ Rows) ---');
    const startTime = Date.now();

    try {
        console.log('Step 1: Fetching data from Google (10m timeout)...');
        const response = await axios.get(GSHEET_CSV_URL, {
            timeout: 600000,
            responseType: 'text',
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            headers: {
                'Accept': 'text/csv,text/plain,application/vnd.ms-excel',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const fetchTime = (Date.now() - startTime) / 1000;
        console.log(`Step 1 Complete: Received ${Math.round(response.data.length / 1024)} KB in ${fetchTime}s.`);

        if (response.data.includes('<!DOCTYPE html>') || response.data.includes('<html')) {
            throw new Error('Google returned HTML instead of CSV. The spreadsheet might be too large or require manual confirmation.');
        }

        console.log('Step 2: Parsing CSV records...');
        const records = parse(response.data, {
            columns: false,
            skip_empty_lines: true,
            from_line: 4,
            relax_column_count: true
        });

        console.log(`Step 2 Complete: Parsed ${records.length} records.`);
        if (records.length === 0) return { success: true, count: 0 };

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [users] = await connection.query('SELECT id FROM users WHERE role = "Admin" LIMIT 1');
            const defaultUserId = users.length > 0 ? users[0].id : 5;

            const orderMap = new Map();
            const orderParts = [];

            console.log('Step 3: Processing records into memory maps...');
            for (const row of records) {
                try {
                    const noOrder = row[2]?.trim();
                    if (!noOrder || noOrder === '0' || noOrder === '') continue;

                    const rowStatus = row[19]?.toLowerCase();
                    if (rowStatus?.includes('reject')) continue;

                    const tglOrderFormatted = formatDateForDB(row[3]);

                    if (!orderMap.has(noOrder)) {
                        orderMap.set(noOrder, {
                            no_order: noOrder,
                            tgl_order: tglOrderFormatted || new Date(),
                            no_rangka: row[10]?.trim() || '-',
                            model: row[11]?.trim() || '-',
                            no_polisi: extractNoPolisi(row[9]) || '-',
                            nama_pelanggan: extractNamaPelanggan(row[9]) || '-',
                            status: mapOrderStatus(row[19]),
                            created_by: defaultUserId
                        });
                    }

                    const noPart = row[5]?.trim();
                    if (noPart) {
                        const qty = parseInt(row[7]) || 0;
                        const suplai = parseInt(row[22]) || 0;
                        orderParts.push({
                            no_order: noOrder,
                            no_part: noPart,
                            nama_part: row[6]?.trim() || '-',
                            qty,
                            etd: formatDateForDB(row[17]) || tglOrderFormatted || new Date(),
                            eta: formatDateForDB(row[18]) || tglOrderFormatted || new Date(),
                            ata: formatDateForDB(row[23]),
                            suplai,
                            sisa: Math.max(0, qty - suplai),
                            status_part: mapPartStatus(qty, suplai)
                        });
                    }
                } catch (e) { continue; }
            }

            console.log(`Step 4: Bulk upserting ${orderMap.size} orders...`);
            const BATCH_SIZE = 1000;
            const orderValues = Array.from(orderMap.values()).map(o => [
                o.no_order, o.tgl_order, o.no_rangka, o.model, o.no_polisi, o.nama_pelanggan, o.status, o.created_by
            ]);

            for (let i = 0; i < orderValues.length; i += BATCH_SIZE) {
                const chunk = orderValues.slice(i, i + BATCH_SIZE);
                await connection.query(
                    `INSERT INTO orders (no_order, tgl_order, no_rangka, model, no_polisi, nama_pelanggan, status, created_by)
                     VALUES ?
                     ON DUPLICATE KEY UPDATE 
                        tgl_order = VALUES(tgl_order),
                        no_rangka = VALUES(no_rangka),
                        model = VALUES(model),
                        no_polisi = VALUES(no_polisi),
                        nama_pelanggan = VALUES(nama_pelanggan),
                        status = VALUES(status)`,
                    [chunk]
                );
            }

            console.log('Step 5: Fetching IDs for part mapping...');
            const orderNumbers = Array.from(orderMap.keys());
            const idMap = new Map();
            for (let i = 0; i < orderNumbers.length; i += 2000) {
                const chunk = orderNumbers.slice(i, i + 2000);
                const [rows] = await connection.query('SELECT id, no_order FROM orders WHERE no_order IN (?)', [chunk]);
                rows.forEach(r => idMap.set(r.no_order, r.id));
            }

            console.log(`Step 6: Bulk upserting ${orderParts.length} parts...`);
            const partValues = orderParts.map(p => [
                idMap.get(p.no_order), p.no_part, p.nama_part, p.qty, p.etd, p.eta, p.ata, p.status_part, p.sisa, p.suplai
            ]).filter(p => p[0] !== undefined);

            for (let i = 0; i < partValues.length; i += BATCH_SIZE) {
                const chunk = partValues.slice(i, i + BATCH_SIZE);
                await connection.query(
                    `INSERT INTO order_parts (order_id, no_part, nama_part, qty, etd, eta, ata, status_part, sisa, suplai)
                     VALUES ?
                     ON DUPLICATE KEY UPDATE
                        nama_part = VALUES(nama_part),
                        qty = VALUES(qty),
                        etd = VALUES(etd),
                        eta = VALUES(eta),
                        ata = VALUES(ata),
                        status_part = VALUES(status_part),
                        sisa = VALUES(sisa),
                        suplai = VALUES(suplai)`,
                    [chunk]
                );
            }

            await connection.commit();
            const totalDuration = (Date.now() - startTime) / 1000;
            console.log(`--- SYNC SUCCESS IN ${totalDuration}s ---`);
            return { success: true, count: records.length, time: totalDuration };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('SYNC FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

function mapOrderStatus(raw) {
    const s = raw?.toLowerCase() || '';
    if (s.includes('complete')) return 'Completed';
    if (s.includes('partial')) return 'Partial';
    if (s.includes('delivery')) return 'On Delivery';
    if (s.includes('overdue')) return 'Overdue';
    return 'On Order';
}

function mapPartStatus(qty, suplai) {
    if (suplai >= qty && qty > 0) return 'Received';
    if (suplai > 0) return 'Partial';
    return 'On Order';
}

function formatDateForDB(dStr) {
    if (!dStr || dStr.trim() === '' || dStr === '-') return null;
    const parts = dStr.split('/');
    if (parts.length === 3) {
        let day = parseInt(parts[0]);
        let month = parseInt(parts[1]);
        const year = parts[2];
        const fullYear = year.length === 2 ? `20${year}` : year;
        if (month > 12 && day <= 12) [day, month] = [month, day];
        if (month > 12 || month < 1 || day > 31 || day < 1) return null;
        return `${fullYear}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
    return null;
}

function extractNoPolisi(keterangan) {
    if (!keterangan) return null;
    const match = keterangan.match(/([A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3})/i);
    return match ? match[0].toUpperCase() : null;
}

function extractNamaPelanggan(keterangan) {
    if (!keterangan) return 'Stok';
    if (keterangan.toLowerCase().includes('stok')) return 'Stok';
    let name = keterangan.replace(/([A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3})/i, '').trim();
    name = name.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
    return name || 'Stok';
}

module.exports = { syncWithGSheet };
