const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// GET /api/parts/mip (Monitoring Incoming Part)
router.get('/mip', verifyToken, async (req, res) => {
    try {
        const { status, dateRangeStart, dateRangeEnd } = req.query;

        let query = `
      SELECT op.*, o.no_order, o.nama_pelanggan, o.no_polisi,
      DATEDIFF(CURRENT_DATE(), op.eta) as lead_time
      FROM order_parts op
      JOIN orders o ON op.order_id = o.id
      WHERE 1=1
    `;
        const queryParams = [];

        if (status && status !== 'All') {
            query += ` AND op.status_part = ?`;
            queryParams.push(status);
        }

        if (dateRangeStart && dateRangeEnd) {
            query += ` AND op.eta BETWEEN ? AND ?`;
            queryParams.push(dateRangeStart, dateRangeEnd);
        }

        query += ` ORDER BY op.eta ASC`;

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
        const [parts] = await connection.query('SELECT * FROM order_parts WHERE id = ?', [partId]);
        if (parts.length === 0) return res.status(404).json({ message: 'Part not found' });
        const part = parts[0];

        // Calculate new suplai/sisa logic if provided
        let newSuplai = suplai !== undefined ? suplai : part.suplai;
        let newSisa = part.qty - newSuplai;
        if (newSisa < 0) newSisa = 0;

        let newStatusPart = status_part || part.status_part;

        // Auto-update status based on sisa
        if (newSisa === 0 && suplai !== undefined) {
            newStatusPart = 'Received';
        } else if (newSisa > 0 && newSisa < part.qty && suplai !== undefined) {
            newStatusPart = 'Partial';
        }

        await connection.query(`
      UPDATE order_parts 
      SET status_part = ?, eta = ?, ata = ?, suplai = ?, sisa = ?
      WHERE id = ?
    `, [
            newStatusPart,
            eta || part.eta,
            ata || part.ata,
            newSuplai,
            newSisa,
            partId
        ]);

        // Check if we need to update the parent Order status
        // If all parts received -> Completed
        // If some parts received -> Partial
        const [allParts] = await connection.query('SELECT status_part FROM order_parts WHERE order_id = ?', [part.order_id]);

        let allReceived = true;
        let anyReceivedOrPartial = false;
        let anyOnDelivery = false;

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

        let newOrderStatus = 'On Order';
        if (allReceived && allParts.length > 0) {
            newOrderStatus = 'Completed';
        } else if (anyReceivedOrPartial) {
            newOrderStatus = 'Partial';
        } else if (anyOnDelivery) {
            newOrderStatus = 'On Delivery';
        }

        await connection.query('UPDATE orders SET status = ? WHERE id = ?', [newOrderStatus, part.order_id]);

        await connection.commit();
        res.json({ message: 'Part updated successfully', status_part: newStatusPart, orderStatus: newOrderStatus });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    } finally {
        connection.release();
    }
});

module.exports = router;
