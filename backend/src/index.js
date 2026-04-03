require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const installmentRoutes = require('./routes/installments');
const repairRoutes = require('./routes/repairs');
const trackingRoutes = require('./routes/tracking');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine for tracking page
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/installments', installmentRoutes);
app.use('/api/repairs', repairRoutes);

// Public tracking page (no auth)
app.use('/track', trackingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'Mukesh Sport API', version: '1.0.0' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🏏 Mukesh Sport API running on port ${PORT}`);
  console.log(`📋 Health check: /api/health\n`);
});
