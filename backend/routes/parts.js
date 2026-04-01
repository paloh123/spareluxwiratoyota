const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// GET /api/parts/mip (Monitoring Incoming Part)
router.get('/mip', verifyToken, async (req, res) => {
    try {
        const { status, dateRangeStart, dateRangeEnd } = req.query;

        let query = `
      SELECT id, no_order, no_part, nama_part, qty, sisa, suplai, eta, status_order as status_part, 
      nama_pelanggan, no_polisi, DATEDIFF(CURRENT_DATE(), eta) as lead_time, last_ata as ata
      FROM orders
      WHERE 1=1
    `;
        const queryParams = [];

        if (status && status !== 'All') {
            query += ` AND status_order = ?`;
            queryParams.push(status);
        }

        if (dateRangeStart && dateRangeEnd) {
            query += ` AND eta BETWEEN ? AND ?`;
            queryParams.push(dateRangeStart, dateRangeEnd);
        }

        query += ` ORDER BY eta ASC`;

        const [rows] = await db.query(query, queryParams);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/parts/:id
// Admin and Partsman can update parts (eta, ata, status_part, sisa, suplai)
router.put('/:id', verifyToken, authorizeRoles('Admin', 'Partsman'), async (req, res) => {
    const connection = await db.getConnection();
    try {
        const partId = req.params.id;
        const { status_part, eta, ata, suplai } = req.body;

        await connection.beginTransaction();

        // Get current part info
        const [parts] = await connection.query('SELECT * FROM orders WHERE id = ?', [partId]);
        if (parts.length === 0) return res.status(404).json({ message: 'Part not found' });
        const part = parts[0];

        // Calculate new suplai/sisa logic if provided
        let newSuplai = suplai !== undefined ? suplai : part.suplai;
        let newSisa = part.qty - newSuplai;
        if (newSisa < 0) newSisa = 0;

        let newStatusPart = status_part || part.status_order;

        // Auto-update status based on sisa
        if (newSisa === 0 && suplai !== undefined && suplai > 0) {
            newStatusPart = 'Received';
        } else if (newSisa > 0 && newSisa < part.qty && suplai !== undefined) {
            newStatusPart = 'Partial';
        }

        await connection.query(`
      UPDATE orders 
      SET status_order = ?, eta = ?, last_ata = ?, suplai = ?, sisa = ?
      WHERE id = ?
    `, [
            newStatusPart,
            eta || part.eta,
            ata || part.last_ata,
            newSuplai,
            newSisa,
            partId
        ]);

        // SYNC STATUS ORDER FOR ALL PARTS IN THE SAME ORDER
        const [allParts] = await connection.query(
            'SELECT status_order FROM orders WHERE no_order = ? AND no_polisi = ?',
            [part.no_order, part.no_polisi]
        );

        const statuses = allParts.map(p => p.status_order);
        const allComp = statuses.every(s => s === 'Completed' || s === 'Received');
        const anyComp = statuses.some(s => s === 'Completed' || s === 'Received');
        const anyDeliv = statuses.some(s => s === 'On Delivery');

        let finalStatus = 'On Order';
        if (allComp) finalStatus = 'Completed';
        else if (anyComp) finalStatus = 'Partial';
        else if (anyDeliv) finalStatus = 'On Delivery';

        await connection.query(
            'UPDATE orders SET status_order = ? WHERE no_order = ? AND no_polisi = ?',
            [finalStatus, part.no_order, part.no_polisi]
        );

        await connection.commit();
        res.json({ message: 'Part updated successfully', status_part: newStatusPart });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
});

module.exports = router;
