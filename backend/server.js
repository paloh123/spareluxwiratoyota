const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*', // Allow all for debugging ngrok
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    credentials: true,
}));

// Request Logger for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Basic Route
app.get('/', (req, res) => {
    res.send('Toyota Dealer System API is running...');
});

// Import Routes
const authRoutes = require('./routes/auth');
const ordersRoutes = require('./routes/orders');
const partsRoutes = require('./routes/parts');
const dashboardRoutes = require('./routes/dashboard');
const usersRoutes = require('./routes/users');
// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/parts', partsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.status(500).json({
        message: 'Something went wrong on the server!',
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    
    // Increase timeout for long-running synchronization (10 minutes)
    server.timeout = 600000;
    server.keepAliveTimeout = 600000;
}

module.exports = app;
