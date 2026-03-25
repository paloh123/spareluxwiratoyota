const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

// Note: Ensure only Admin can access these routes
router.use(verifyToken, authorizeRoles('Admin'));

// GET /api/users
router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, created_at FROM users');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /api/users
router.post('/', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(`
      INSERT INTO users (name, email, password, role)
      VALUES (?, ?, ?, ?)
    `, [name, email, hashedPassword, role]);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userId = req.params.id;

        let query = 'UPDATE users SET name = ?, email = ?, role = ?';
        const params = [name, email, role];

        if (password) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            query += ', password = ?';
            params.push(hashedPassword);
        }

        query += ' WHERE id = ?';
        params.push(userId);

        await db.query(query, params);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
