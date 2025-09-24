const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Database configuration
const config = require('../config/database');
const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: console.log,
    ssl: dbConfig.ssl
  }
);

async function setupDatabase() {
  try {
    console.log('🔌 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Read and execute the SQL script
    const sqlPath = path.join(__dirname, '..', 'admin', 'create_tables.sql');
    
    if (!fs.existsSync(sqlPath)) {
      console.log('⚠️  SQL script not found, creating basic table structure...');
      
      // Create basic table structure
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "Events" (
          event_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          event_name VARCHAR(255) NOT NULL,
          event_type VARCHAR(255) NOT NULL,
          event_location VARCHAR(255) NOT NULL,
          event_date DATE NOT NULL,
          event_description TEXT NOT NULL,
          menu_title VARCHAR(255) NOT NULL,
          menu_image_filename VARCHAR(255) NOT NULL
        );
      `);
      
      console.log('✅ Basic table structure created.');
    } else {
      console.log('📄 Reading SQL script...');
      const sqlScript = fs.readFileSync(sqlPath, 'utf8');
      
      // Split the script into individual statements
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Executing ${statements.length} SQL statements...`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await sequelize.query(statement);
            console.log('✅ Statement executed successfully');
          } catch (error) {
            if (error.message.includes('already exists')) {
              console.log('⚠️  Table already exists, skipping...');
            } else {
              console.error('❌ Error executing statement:', error.message);
            }
          }
        }
      }
    }

    // Verify table exists and count records
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM "Events"');
    console.log(`📊 Total records in Events table: ${results[0].count}`);

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Unable to setup database:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
