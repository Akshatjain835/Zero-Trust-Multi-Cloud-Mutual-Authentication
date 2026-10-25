const express = require('express');
const cors = require('cors');
const config = require('./config');
const connectDB = require('./config/db');

// Connect to MongoDB (meditrust_auth)
connectDB();


const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const systemRoutes = require('./routes/system.routes');

const app = express();
app.use(cors());
app.use(express.json());

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/system', systemRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`☁️ Cloud A (AWS Auth & Identity Gateway) listening on HTTP port ${PORT}`);
  console.log(`🔒 Connected to Cloud B (${config.cloudBUrl}) and Cloud C (${config.cloudCUrl}) via Zero-Trust mTLS!`);
});
