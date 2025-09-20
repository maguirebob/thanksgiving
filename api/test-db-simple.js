const express = require('express');
const { Client } = require('pg');

const app = express();

app.get('/', async (req, res) => {
  try {
    console.log('Testing direct pg connection...');
    console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
    
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await client.connect();
    console.log('Direct pg connection successful');
    
    // Test a simple query
    const result = await client.query('SELECT COUNT(*) FROM "Events"');
    const eventCount = parseInt(result.rows[0].count);
    
    await client.end();
    
    res.json({
      status: 'SUCCESS',
      message: 'Direct pg connection works',
      eventCount: eventCount,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Direct pg connection failed:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Direct pg connection failed',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;
