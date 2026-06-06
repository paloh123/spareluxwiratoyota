const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/ready-installation
 * 
 * Ambil semua data part yang:
 *   - status_order = 'Received' atau 'Completed' (part sudah datang/ready)
 *   - DAN (status_pemasangan != 'SELESAI' OR status_gudang != 'DIAMBIL')
 *
 * Query params:
 *   - search     : string   full-text search no_order / nama_pelanggan / no_polisi / nama_part
 *   - status     : 'BELUM_DIPASANG' | 'BELUM_DIAMBIL' | 'OVERDUE' | 'All'
 *   - sa         : string   filter by SA name
 *   - foreman    : string   filter by foreman name
 *   - from       : date     filter tanggal_order mulai
 *   - to         : date     filter tanggal_order sampai
 *   - page       : int      default 1
 *   - limit      : int      default 20
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const {
            search, status, sa, foreman,
            from, to,
            page = 1, limit = 20
        } = req.query;

        let query = `
            SELECT 
                o.id,
                o.no_order,
                o.nama_pelanggan,
                o.no_polisi,
                o.sa,
                o.foreman,
                o.nama_part,
                o.qty,
                o.tgl_order,
                o.last_ata         AS tanggal_part_datang,
                o.tanggal_part_datang AS tanggal_part_datang_custom,
                o.status_order,
                o.status_gudang,
                o.status_pemasangan,
                DATEDIFF(CURRENT_DATE(), COALESCE(o.tanggal_part_datang, o.last_ata, o.tgl_order)) AS umur_pending
            FROM orders o
            WHERE 1=1
              AND o.status_order IN ('Received', 'Completed')
              AND (
                    o.status_pemasangan != 'SELESAI'
                    OR o.status_gudang   != 'DIAMBIL'
              )
        `;

        const params = [];

        if (search) {
            const t = `%${search}%`;
            query += ` AND (o.no_order LIKE ? OR o.nama_pelanggan LIKE ? OR o.no_polisi LIKE ? OR o.nama_part LIKE ?)`;
            params.push(t, t, t, t);
        }

        if (status && status !== 'All') {
            if (status === 'BELUM_DIPASANG') {
                query += ` AND o.status_pemasangan = 'BELUM_DIPASANG'`;
            } else if (status === 'BELUM_DIAMBIL') {
                query += ` AND o.status_gudang = 'BELUM_DIAMBIL'`;
            } else if (status === 'OVERDUE') {
                query += ` AND DATEDIFF(CURRENT_DATE(), COALESCE(o.tanggal_part_datang, o.last_ata, o.tgl_order)) > 3`;
            }
        }

        if (sa) {
            query += ` AND o.sa LIKE ?`;
            params.push(`%${sa}%`);
        }

        if (foreman) {
            query += ` AND o.foreman LIKE ?`;
            params.push(`%${foreman}%`);
        }

        if (from) {
            query += ` AND o.tgl_order >= ?`;
            params.push(from);
        }

        if (to) {
            query += ` AND o.tgl_order <= ?`;
            params.push(to);
        }

        // Count total sebelum pagination
        const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS sub`;
        const [[{ total }]] = await db.query(countQuery, params);

        // Order: overdue dulu, lalu umur pending terlama
        query += ` ORDER BY umur_pending DESC, o.tgl_order ASC`;

        // Pagination
        const offset = (parseInt(page) - 1) * parseInt(limit);
        query += ` LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), offset);

        const [rows] = await db.query(query, params);

        // Normalize tanggal_part_datang: prioritaskan custom field, fallback ke last_ata
        const data = rows.map(r => ({
            ...r,
            tanggal_part_datang: r.tanggal_part_datang_custom || r.tanggal_part_datang,
            umur_pending: r.umur_pending !== null ? parseInt(r.umur_pending) : null,
            is_overdue: parseInt(r.umur_pending) > 3
        }));

        res.json({
            data,
            pagination: {
                total: parseInt(total),
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('GET /ready-installation Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

/**
 * GET /api/ready-installation/stats
 * Statistik ringkasan untuk stat cards
 */
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const [[stats]] = await db.query(`
            SELECT
                COUNT(*) AS total_ready,
                SUM(CASE WHEN status_pemasangan = 'BELUM_DIPASANG' THEN 1 ELSE 0 END) AS belum_dipasang,
                SUM(CASE WHEN status_gudang = 'BELUM_DIAMBIL' THEN 1 ELSE 0 END)      AS belum_diambil,
                SUM(
                    CASE WHEN DATEDIFF(CURRENT_DATE(), COALESCE(tanggal_part_datang, last_ata, tgl_order)) > 3 THEN 1 ELSE 0 END
                ) AS overdue
            FROM orders
            WHERE status_order IN ('Received', 'Completed')
              AND (status_pemasangan != 'SELESAI' OR status_gudang != 'DIAMBIL')
        `);

        res.json({
            total_ready: parseInt(stats.total_ready) || 0,
            belum_dipasang: parseInt(stats.belum_dipasang) || 0,
            belum_diambil: parseInt(stats.belum_diambil) || 0,
            overdue: parseInt(stats.overdue) || 0
        });
    } catch (error) {
        console.error('GET /ready-installation/stats Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

/**
 * GET /api/ready-installation/filters
 * Ambil daftar unik SA & Foreman untuk filter dropdown
 */
router.get('/filters', verifyToken, async (req, res) => {
    try {
        const [saRows] = await db.query(`
            SELECT DISTINCT sa FROM orders
            WHERE sa IS NOT NULL AND sa != ''
              AND status_order IN ('Received', 'Completed')
            ORDER BY sa ASC
        `);
        const [foremanRows] = await db.query(`
            SELECT DISTINCT foreman FROM orders
            WHERE foreman IS NOT NULL AND foreman != ''
              AND status_order IN ('Received', 'Completed')
            ORDER BY foreman ASC
        `);

        res.json({
            sa_list: saRows.map(r => r.sa),
            foreman_list: foremanRows.map(r => r.foreman)
        });
    } catch (error) {
        console.error('GET /ready-installation/filters Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

/**
 * PATCH /api/ready-installation/:id/dipasang
 * Update status_pemasangan menjadi SELESAI
 */
router.patch('/:id/dipasang', verifyToken, async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE orders SET status_pemasangan = 'SELESAI' WHERE id = ?`,
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });
        res.json({ message: 'Status pemasangan diperbarui menjadi SELESAI' });
    } catch (error) {
        console.error('PATCH /:id/dipasang Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

/**
 * PATCH /api/ready-installation/:id/diambil
 * Update status_gudang menjadi DIAMBIL
 */
router.patch('/:id/diambil', verifyToken, async (req, res) => {
    try {
        const [result] = await db.query(
            `UPDATE orders SET status_gudang = 'DIAMBIL' WHERE id = ?`,
            [req.params.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Order tidak ditemukan' });
        res.json({ message: 'Status gudang diperbarui menjadi DIAMBIL' });
    } catch (error) {
        console.error('PATCH /:id/diambil Error:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;
