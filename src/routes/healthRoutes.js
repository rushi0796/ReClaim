const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'RECLAIM',
    version: '0.1.0'
  });
});

module.exports = router;
