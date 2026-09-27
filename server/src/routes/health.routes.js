const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

router.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbMessage = '';

  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
    dbMessage = error.message;
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    server: 'running',
    database: {
      status: dbStatus,
      ...(dbMessage && { error: dbMessage })
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
