const { execSync } = require('child_process');
const path = require('path');

async function runMigrationsAndStartServer() {
  try {
    console.log('🚀 Running database migrations...');
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.error('⏰ Migration timeout after 60 seconds');
      throw new Error('Migration timeout');
    }, 60000);
    
    execSync('npx prisma migrate deploy', { stdio: 'inherit', timeout: 60000 });
    clearTimeout(timeout);
    console.log('✅ Database migrations applied successfully.');
  } catch (migrationError) {
    console.error('⚠️ Migration failed, but continuing with server start:', migrationError.message);
    console.log('📝 Note: Server will start but may have database issues. Check logs for details.');
  }

  try {
    console.log('🚀 Starting server...');
    require(path.join(__dirname, '../dist/server.js'));
  } catch (serverError) {
    console.error('❌ Failed to start server:', serverError);
    process.exit(1);
  }
}

runMigrationsAndStartServer();