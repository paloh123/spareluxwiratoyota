const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL // To be set in production (e.g., your-vercel-app.vercel.app)
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());


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

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Increase timeout for long-running synchronization (10 minutes)
server.timeout = 600000;
server.keepAliveTimeout = 600000;
