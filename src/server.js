const express = require('express');
const cors = require('cors');
require('dotenv').config();

const healthRoutes = require('./routes/healthRoutes');
const recoveryRoutes = require('./routes/recoveryRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const { getAuditLogs } = require('./utils/auditLogger');

app.use(cors());
app.use(express.json());

// Routes
app.use('/', healthRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/webhooks', webhookRoutes);

app.get('/api/audit', (req, res) => {
  res.json(getAuditLogs());
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`RECLAIM Recovery Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
