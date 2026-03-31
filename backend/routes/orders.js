const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { syncWithGSheet } = require('../utils/gsheetSync');

// POST /api/orders/sync
// Sync with Google Spreadsheet. Admin & Partsman only.
router.post('/sync', verifyToken, authorizeRoles('Admin', 'Partsman'), async (req, res) => {
    try {
        console.log('--- Sync process started via API ---');
        const result = await syncWithGSheet();
        if (result.success) {
            console.log(`Sync success: ${result.count} records processed.`);
            res.json({
                message: `Sinkronisasi berhasil. ${result.count} data diproses.`,
                count: result.count,
                duration: result.time
            });
        } else {
            console.error('Sync process reported failure:', result.error);
            res.status(500).json({
                message: 'Gagal melakukan sinkronisasi',
                error: result.error
            });
        }
    } catch (error) {
        console.error('CRITICAL: Sync endpoint exception:', error);
        res.status(500).json({
            message: 'Terjadi kesalahan sistem saat sinkronisasi',
            error: error.message
        });
    }
});

// GET /api/orders
// Returns list of orders with optional query params (search, status, etc)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { search, status, sort, order = 'DESC', page = 1, limit = 10 } = req.query;

        let query = `
      SELECT MAX(o.id) as id, o.no_order, MAX(o.tgl_order) as tgl_order, 
        MAX(o.nama_pelanggan) as nama_pelanggan, MAX(o.no_polisi) as no_polisi, 
        MAX(o.status_order) as status, 
        COUNT(*) as total_part,
        MAX(DATEDIFF(CURRENT_DATE(), o.tgl_order)) as umur_order,
        MAX(u.name) as created_by_name
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE 1=1
    `;
        const queryParams = [];

        if (search) {
            query += ` AND (o.no_order LIKE ? OR o.no_polisi LIKE ? OR o.no_rangka LIKE ? OR o.nama_pelanggan LIKE ?)`;
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status && status !== 'All') {
            query += ` AND o.status_order = ?`;
            queryParams.push(status);
        }

        query += ` GROUP BY o.no_order`;

        // Sorting
        const allowedSortColumns = ['no_order', 'tgl_order', 'nama_pelanggan', 'no_polisi', 'status', 'total_part', 'umur_order'];
        let sortCol = allowedSortColumns.includes(sort) ? sort : 'tgl_order';
        
        // Alias mapping for sorting in GROUP BY
        if (sortCol === 'status') sortCol = 'MAX(o.status_order)';
        if (sortCol === 'tgl_order') sortCol = 'MAX(o.tgl_order)';
        if (sortCol === 'nama_pelanggan') sortCol = 'MAX(o.nama_pelanggan)';
        if (sortCol === 'no_polisi') sortCol = 'MAX(o.no_polisi)';
        if (sortCol === 'total_part') sortCol = 'COUNT(*)';
        if (sortCol === 'umur_order') sortCol = 'MAX(DATEDIFF(CURRENT_DATE(), o.tgl_order))';

        const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortCol} ${sortDir}`;

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        const [rows] = await db.query(query, queryParams);

        // Get total count for pagination (count of groups)
        let countQuery = `SELECT COUNT(DISTINCT no_order) as total FROM orders o WHERE 1=1`;
        const countParams = [];
        if (search) {
            countQuery += ` AND (o.no_order LIKE ? OR o.no_polisi LIKE ? OR o.no_rangka LIKE ? OR o.nama_pelanggan LIKE ?)`;
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (status && status !== 'All') {
            countQuery += ` AND o.status_order = ?`;
            countParams.push(status);
        }
        const [[{ total }]] = await db.query(countQuery, countParams);

        res.json({
            data: rows,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/orders/:id
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const [initialRow] = await db.query(`
      SELECT o.no_order
      FROM orders o
      WHERE o.id = ?
    `, [req.params.id]);

        if (initialRow.length === 0) return res.status(404).json({ message: 'Order not found' });

        const noOrder = initialRow[0].no_order;

        const [allParts] = await db.query(`
      SELECT o.*, u.name as created_by_name,
      DATEDIFF(CURRENT_DATE(), o.tgl_order) as umur_order
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.no_order = ?
    `, [noOrder]);

        // Map status_order to status for frontend
        const parts = allParts.map(p => ({ ...p, status: p.status_order }));
        const mainOrder = { ...parts[0], parts };

        res.json(mainOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/orders
// Array of parts included in body. Partsman & Admin only
router.post('/', verifyToken, authorizeRoles('Admin', 'Partsman'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const {
            no_order, tgl_order, no_rangka, model, no_polisi, nama_pelanggan,
            parts // Array of part objects
        } = req.body;

        // Default status is 'On Order'
        const status_order = req.body.status_order || req.body.status || 'On Order';

        if (parts && parts.length > 0) {
            const partValues = parts.map(p => [
                no_order, tgl_order || new Date(), p.no_part, p.nama_part, p.qty, p.etd, p.eta,
                status_order, p.sisa !== undefined ? p.sisa : p.qty, p.suplai || 0,
                no_rangka, model, no_polisi, nama_pelanggan, req.user.id
            ]);

            await connection.query(`
        INSERT INTO orders 
        (no_order, tgl_order, no_part, nama_part, qty, etd, eta, status_order, sisa, suplai, no_rangka, model, no_polisi, nama_pelanggan, created_by)
        VALUES ?
      `, [partValues]);
        } else {
            // Insert single row if no parts (unlikely but safe)
            await connection.query(`
        INSERT INTO orders 
        (no_order, tgl_order, no_rangka, model, no_polisi, nama_pelanggan, status_order, created_by, no_part, nama_part)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [no_order, tgl_order || new Date(), no_rangka, model, no_polisi, nama_pelanggan, status_order, req.user.id, '-', '-']);
        }

        await connection.commit();
        res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Order Number already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
});

// PUT /api/orders/:id
// Update order data + parts. Admin & Partsman only.
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Partsman'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const pkgId = req.params.id;
        const {
            no_order, tgl_order, no_rangka, model, no_polisi, nama_pelanggan, status,
            parts // Array of part objects
        } = req.body;

        // Find current no_order for this record
        const [existing] = await connection.query('SELECT no_order FROM orders WHERE id = ?', [pkgId]);
        if (existing.length === 0) return res.status(404).json({ message: 'Order not found' });
        const oldNoOrder = existing[0].no_order;

        const safeFormatDate = (d) => {
            if (!d) return null;
            try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0];
            } catch (e) { return null; }
        };

        const formattedDate = safeFormatDate(tgl_order);
        const finalStatus = status || 'On Order';

        // Delete all old rows for this order and re-insert (Cleanest for denormalized)
        await connection.query('DELETE FROM orders WHERE no_order = ?', [oldNoOrder]);

        if (parts && Array.isArray(parts) && parts.length > 0) {
            const partValues = parts.map(p => [
                no_order, formattedDate, p.no_part, p.nama_part, parseInt(p.qty) || 0,
                safeFormatDate(p.etd), safeFormatDate(p.eta), p.status_part || p.status_order || finalStatus,
                parseInt(p.sisa) || 0, parseInt(p.suplai) || 0,
                no_rangka, model, no_polisi, nama_pelanggan, req.user.id
            ]);

            await connection.query(`
                INSERT INTO orders (no_order, tgl_order, no_part, nama_part, qty, etd, eta, status_order, sisa, suplai, no_rangka, model, no_polisi, nama_pelanggan, created_by)
                VALUES ?
            `, [partValues]);
        }

        await connection.commit();
        res.json({ message: 'Order updated successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('PUT /:id Error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Nomor Order sudah ada' });
        }
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        connection.release();
    }
});

// DELETE /api/orders/:id
// Admin only
router.delete('/:id', verifyToken, authorizeRoles('Admin'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const orderId = req.params.id;
        const [existing] = await connection.query('SELECT no_order FROM orders WHERE id = ?', [orderId]);
        if (existing.length === 0) return res.status(404).json({ message: 'Order not found' });

        const noOrder = existing[0].no_order;
        await connection.query('DELETE FROM orders WHERE no_order = ?', [noOrder]);

        await connection.commit();
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        await connection.rollback();
        console.error('DELETE /:id Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    } finally {
        connection.release();
    }
});

// POST /api/orders/import
// Import orders from Excel/CSV. Admin & Partsman only
router.post('/import', verifyToken, authorizeRoles('Admin', 'Partsman'), async (req, res) => {
    console.log("=== Import API Hit ===");
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const orders = req.body;

        if (!Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ message: 'Data tidak valid atau kosong' });
        }

        const safeFormatDate = (d) => {
            if (!d) return null;
            try {
                let dateObj;
                if (!isNaN(d)) {
                    // Excel serial date 
                    dateObj = new Date((d - (25567 + 1)) * 86400 * 1000); 
                } else {
                    dateObj = new Date(d);
                }
                if (!isNaN(dateObj.getTime())) {
                    return dateObj.toISOString().split('T')[0];
                }
            } catch (e) {}
            return null;
        };

        const insertValues = [];
        const userId = req.user ? req.user.id : null;

        for (const row of orders) {
            if (!row.no_order) continue; // Skip invalid rows

            const val = [
                row.no_order, 
                safeFormatDate(row.tgl_order) || new Date().toISOString().split('T')[0], 
                row.jenis_order || '', 
                row.no_part || '-', 
                row.nama_part || '', 
                row.qty || 0, 
                row.tipe || '', 
                row.keterangan || '', 
                row.no_rangka || '', 
                row.model || '', 
                row.tipe_mobil || '', 
                row.hp_contact || '', 
                safeFormatDate(row.etd), 
                safeFormatDate(row.eta), 
                row.status_order || 'On Order', 
                row.sisa || 0, 
                row.delivery || '', 
                row.suplai || 0, 
                safeFormatDate(row.kedatangan_1), 
                safeFormatDate(row.kedatangan_2), 
                safeFormatDate(row.kedatangan_3), 
                safeFormatDate(row.kedatangan_4), 
                safeFormatDate(row.kedatangan_5), 
                safeFormatDate(row.last_ata), 
                row.lead_time_order || 0, 
                row.lead_time_delivery || 0, 
                row.umur_order || 0,
                row.nama_pelanggan || '-', 
                row.no_polisi || '-', 
                userId
            ];
            insertValues.push(val);
        }

        if (insertValues.length > 0) {
            await connection.query(`
                INSERT INTO orders (
                    no_order, tgl_order, jenis_order, no_part, nama_part, qty, tipe, keterangan, 
                    no_rangka, model, tipe_mobil, hp_contact, etd, eta, status_order, sisa, 
                    delivery, suplai, kedatangan_1, kedatangan_2, kedatangan_3, kedatangan_4, 
                    kedatangan_5, last_ata, lead_time_order, lead_time_delivery, umur_order,
                    nama_pelanggan, no_polisi, created_by
                ) VALUES ?
                ON DUPLICATE KEY UPDATE 
                    tgl_order=VALUES(tgl_order), 
                    jenis_order=COALESCE(NULLIF(VALUES(jenis_order), ''), jenis_order), 
                    nama_part=COALESCE(NULLIF(VALUES(nama_part), ''), nama_part), 
                    qty=VALUES(qty), 
                    tipe=COALESCE(NULLIF(VALUES(tipe), ''), tipe), 
                    keterangan=COALESCE(NULLIF(VALUES(keterangan), ''), keterangan), 
                    no_rangka=COALESCE(NULLIF(VALUES(no_rangka), ''), no_rangka), 
                    model=COALESCE(NULLIF(VALUES(model), ''), model), 
                    tipe_mobil=COALESCE(NULLIF(VALUES(tipe_mobil), ''), tipe_mobil), 
                    hp_contact=COALESCE(NULLIF(VALUES(hp_contact), ''), hp_contact), 
                    etd=COALESCE(VALUES(etd), etd), 
                    eta=COALESCE(VALUES(eta), eta), 
                    status_order=VALUES(status_order), 
                    sisa=VALUES(sisa), 
                    delivery=COALESCE(NULLIF(VALUES(delivery), ''), delivery), 
                    suplai=VALUES(suplai), 
                    kedatangan_1=COALESCE(VALUES(kedatangan_1), kedatangan_1), 
                    kedatangan_2=COALESCE(VALUES(kedatangan_2), kedatangan_2), 
                    kedatangan_3=COALESCE(VALUES(kedatangan_3), kedatangan_3), 
                    kedatangan_4=COALESCE(VALUES(kedatangan_4), kedatangan_4), 
                    kedatangan_5=COALESCE(VALUES(kedatangan_5), kedatangan_5), 
                    last_ata=COALESCE(VALUES(last_ata), last_ata), 
                    lead_time_order=VALUES(lead_time_order), 
                    lead_time_delivery=VALUES(lead_time_delivery), 
                    umur_order=VALUES(umur_order), 
                    nama_pelanggan=COALESCE(NULLIF(VALUES(nama_pelanggan), '-'), nama_pelanggan), 
                    no_polisi=COALESCE(NULLIF(VALUES(no_polisi), '-'), no_polisi)
            `, [insertValues]);
        }

        await connection.commit();
        res.json({ message: `Import berhasil. ${insertValues.length} baris data diproses secara UPSERT.` });
    } catch (error) {
        await connection.rollback();
        console.error('POST /import Error:', error);
        res.status(500).json({ message: `Kesalahan SQL: ${error.message}`, error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
