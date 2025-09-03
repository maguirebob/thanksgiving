const { Client } = require('pg');

module.exports = async (req, res) => {
  try {
    const databaseUrl = process.env.POSTGRES_URL;
    
    if (!databaseUrl) {
      return res.status(500).json({
        message: 'No POSTGRES_URL found',
        timestamp: new Date().toISOString(),
        hasPostgresUrl: false
      });
    }

    const client = new Client({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    await client.connect();
    
    const result = await client.query('SELECT NOW() as current_time');
    
    await client.end();
    
    res.json({
      message: 'Direct pg connection successful',
      timestamp: new Date().toISOString(),
      currentTime: result.rows[0].current_time,
      hasPostgresUrl: true,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({
      message: 'Direct pg connection failed',
      timestamp: new Date().toISOString(),
      error: error.message,
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      environment: process.env.NODE_ENV
    });
  }
};
