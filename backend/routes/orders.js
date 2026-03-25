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
      SELECT o.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM order_parts op WHERE op.order_id = o.id) as total_part,
        DATEDIFF(CURRENT_DATE(), o.tgl_order) as umur_order
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
            query += ` AND o.status = ?`;
            queryParams.push(status);
        }

        // Sorting
        const allowedSortColumns = ['no_order', 'tgl_order', 'nama_pelanggan', 'no_polisi', 'status', 'total_part', 'umur_order'];
        const sortCol = allowedSortColumns.includes(sort) ? sort : 'o.tgl_order';
        const sortDir = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${sortCol} ${sortDir}`;

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ? OFFSET ?`;
        queryParams.push(parseInt(limit), offset);

        const [rows] = await db.query(query, queryParams);

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM orders o WHERE 1=1`;
        const countParams = [];
        if (search) {
            countQuery += ` AND (o.no_order LIKE ? OR o.no_polisi LIKE ? OR o.no_rangka LIKE ? OR o.nama_pelanggan LIKE ?)`;
            const searchTerm = `%${search}%`;
            countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }
        if (status && status !== 'All') {
            countQuery += ` AND o.status = ?`;
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
        const [orders] = await db.query(`
      SELECT o.*, u.name as created_by_name,
      DATEDIFF(CURRENT_DATE(), o.tgl_order) as umur_order
      FROM orders o
      LEFT JOIN users u ON o.created_by = u.id
      WHERE o.id = ?
    `, [req.params.id]);

        if (orders.length === 0) return res.status(404).json({ message: 'Order not found' });

        const [parts] = await db.query('SELECT * FROM order_parts WHERE order_id = ?', [req.params.id]);

        res.json({ ...orders[0], parts });
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
        const status = 'On Order';

        const [orderResult] = await connection.query(`
      INSERT INTO orders 
      (no_order, tgl_order, no_rangka, model, no_polisi, nama_pelanggan, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [no_order, tgl_order || new Date(), no_rangka, model, no_polisi, nama_pelanggan, status, req.user.id]);

        const orderId = orderResult.insertId;

        if (parts && parts.length > 0) {
            const partValues = parts.map(p => [
                orderId, p.no_part, p.nama_part, p.qty, p.etd, p.eta,
                p.ata || null, p.status_part || 'On Order', p.qty, 0 // sisa = qty, suplai = 0 initially
            ]);

            await connection.query(`
        INSERT INTO order_parts 
        (order_id, no_part, nama_part, qty, etd, eta, ata, status_part, sisa, suplai)
        VALUES ?
      `, [partValues]);
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

        const orderId = req.params.id;
        console.log(`PUT /api/orders/${orderId} - Basic data update`);
        const {
            no_order, tgl_order, no_rangka, model, no_polisi, nama_pelanggan, status,
            parts // Array of part objects (with optional id for existing parts)
        } = req.body;

        // Check order exists
        const [existing] = await connection.query('SELECT id FROM orders WHERE id = ?', [orderId]);
        if (existing.length === 0) {
            console.log('Order not found:', orderId);
            return res.status(404).json({ message: 'Order not found' });
        }

        const safeFormatDate = (d) => {
            if (!d) return null;
            try {
                const date = new Date(d);
                if (isNaN(date.getTime())) return null;
                return date.toISOString().split('T')[0];
            } catch (e) { return null; }
        };

        const formattedDate = safeFormatDate(tgl_order);

        console.log('Update orders table...');
        await connection.query(`
            UPDATE orders SET no_order=?, tgl_order=?, no_rangka=?, model=?, no_polisi=?, nama_pelanggan=?, status=?
            WHERE id = ?
        `, [no_order, formattedDate, no_rangka, model, no_polisi, nama_pelanggan, status || 'On Order', orderId]);

        if (parts && Array.isArray(parts)) {
            console.log(`Processing ${parts.length} parts...`);
            // Delete all existing parts then re-insert (simpler approach)
            await connection.query('DELETE FROM order_parts WHERE order_id = ?', [orderId]);

            if (parts.length > 0) {
                const partValues = parts.map(p => {
                    const qty = parseInt(p.qty) || 0;
                    const suplai = parseInt(p.suplai) || 0;
                    const sisa = (p.sisa !== undefined && !isNaN(parseInt(p.sisa))) ? parseInt(p.sisa) : qty;

                    return [
                        orderId, p.no_part, p.nama_part,
                        qty,
                        safeFormatDate(p.etd), safeFormatDate(p.eta), safeFormatDate(p.ata),
                        p.status_part || 'On Order',
                        sisa,
                        suplai
                    ];
                });

                await connection.query(`
                    INSERT INTO order_parts (order_id, no_part, nama_part, qty, etd, eta, ata, status_part, sisa, suplai)
                    VALUES ?
                `, [partValues]);
            }

            // --- AUTO RECALCULATE ORDER STATUS BASED ON PARTS ---
            // Fetch the newly inserted/updated parts
            const [allParts] = await connection.query('SELECT status_part FROM order_parts WHERE order_id = ?', [orderId]);

            let allReceived = true;
            let anyReceivedOrPartial = false;
            let anyOnDelivery = false;

            if (allParts.length === 0) {
                allReceived = false;
            } else {
                for (const p of allParts) {
                    if (p.status_part === 'Received') {
                        anyReceivedOrPartial = true;
                    } else if (p.status_part === 'Partial') {
                        anyReceivedOrPartial = true;
                        allReceived = false;
                    } else {
                        allReceived = false;
                        if (p.status_part === 'On Delivery') anyOnDelivery = true;
                    }
                }
            }

            let newOrderStatus = 'On Order';
            if (allReceived && allParts.length > 0) {
                newOrderStatus = 'Completed';
            } else if (anyReceivedOrPartial) {
                newOrderStatus = 'Partial';
            } else if (anyOnDelivery) {
                newOrderStatus = 'On Delivery';
            }

            // Update the order with calculated status (overriding whatever was in the body if parts exist)
            await connection.query('UPDATE orders SET status = ? WHERE id = ?', [newOrderStatus, orderId]);
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
        const [existing] = await connection.query('SELECT id FROM orders WHERE id = ?', [orderId]);
        if (existing.length === 0) return res.status(404).json({ message: 'Order not found' });

        await connection.query('DELETE FROM order_parts WHERE order_id = ?', [orderId]);
        await connection.query('DELETE FROM orders WHERE id = ?', [orderId]);

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
    console.log("Body length:", req.body ? req.body.length : 'undefined');
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const orders = req.body;

        if (!Array.isArray(orders) || orders.length === 0) {
            console.log("Validation failed: Not an array or empty", typeof orders);
            return res.status(400).json({ message: 'Data tidak valid atau kosong' });
        }

        let importedCount = 0;

        for (const order of orders) {
            // Field mapping: No Order -> no_order, Tanggal -> tanggal, Nama Pelanggan -> nama_pelanggan, No Polisi -> no_polisi, Status -> status
            const { no_order, tanggal, nama_pelanggan, no_polisi, status } = order;

            if (!no_order || !nama_pelanggan) continue; // Skip invalid rows

            // Safe date formatting
            let formattedDate = null;
            if (tanggal) {
                try {
                    // Try to parse excel date if it's a number, or string date
                    let dateObj;
                    if (!isNaN(tanggal)) {
                        // Excel serial date (days since 1899-12-30)
                        dateObj = new Date((tanggal - (25567 + 1)) * 86400 * 1000); // adjust for JS timezone offset later if needed, but standard new Date handles it roughly. If it's string, standard Parse.
                    } else {
                        dateObj = new Date(tanggal);
                    }
                    
                    if (!isNaN(dateObj.getTime())) {
                        formattedDate = dateObj.toISOString().split('T')[0];
                    }
                } catch (e) {}
            }
            if (!formattedDate) formattedDate = new Date().toISOString().split('T')[0];

            let finalStatus = status || 'On Order';

            // Check if order exists
            const [existing] = await connection.query('SELECT id FROM orders WHERE no_order = ?', [no_order]);
            
            if (existing.length > 0) {
                // Update existing order
                await connection.query(`
                    UPDATE orders SET tgl_order=?, nama_pelanggan=?, no_polisi=?, status=?
                    WHERE no_order = ?
                `, [formattedDate, nama_pelanggan, no_polisi || '', finalStatus, no_order]);
            } else {
                // Insert new order
                const userId = req.user ? req.user.id : null;
                await connection.query(`
                    INSERT INTO orders (no_order, tgl_order, no_rangka, model, no_polisi, nama_pelanggan, status, created_by)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `, [no_order, formattedDate, '', '', no_polisi || '', nama_pelanggan, finalStatus, userId]);
            }
            importedCount++;
        }

        await connection.commit();
        res.json({ message: `Import berhasil. ${importedCount} data diproses.` });
    } catch (error) {
        await connection.rollback();
        console.error('POST /import Error:', error);
        res.status(500).json({ message: 'Terjadi kesalahan saat import data', error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;
