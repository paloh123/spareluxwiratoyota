const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// GET /api/dashboard/summary
// Get counts for dashboard cards
router.get('/summary', verifyToken, async (req, res) => {
    try {
        const [counts] = await db.query(`
        SELECT 
        COUNT(*) as total_order,
        SUM(CASE WHEN status_order = 'On Order' THEN 1 ELSE 0 END) as on_order,
        SUM(CASE WHEN status_order = 'On Delivery' THEN 1 ELSE 0 END) as on_delivery,
        SUM(CASE WHEN status_order = 'Completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status_order = 'Partial' THEN 1 ELSE 0 END) as partial,
        SUM(CASE WHEN status_order = 'Overdue' THEN 1 ELSE 0 END) as overdue
      FROM (
        SELECT no_order, no_polisi, MAX(status_order) as status_order
        FROM orders
        GROUP BY no_order, no_polisi
      ) as grouped_orders
    `);

        res.json(counts[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /api/dashboard/charts
// Get data for pie chart (status distribution) & line chart (orders per month)
router.get('/charts', verifyToken, async (req, res) => {
    try {
        const [pieData] = await db.query(`
      SELECT status_order as name, COUNT(*) as value
      FROM (
        SELECT no_order, no_polisi, MAX(status_order) as status_order
        FROM orders
        GROUP BY no_order, no_polisi
      ) as grouped
      GROUP BY status_order
    `);

        // Line Chart: Orders per month for the current year
        const [lineData] = await db.query(`
      SELECT 
        MONTHNAME(tgl_order) as month, 
        COUNT(*) as order_count 
      FROM (
        SELECT no_order, no_polisi, MAX(tgl_order) as tgl_order
        FROM orders 
        WHERE YEAR(tgl_order) = YEAR(CURRENT_DATE())
        GROUP BY no_order, no_polisi
      ) as grouped
      GROUP BY MONTH(tgl_order), MONTHNAME(tgl_order)
      ORDER BY MONTH(tgl_order)
    `);

        res.json({ pieData, lineData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
