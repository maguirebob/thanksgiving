const { Event, sequelize } = require('../models');
require('dotenv').config();

async function testDatabase() {
  console.log('🧪 Testing database connection...');
  console.log('📊 Environment:', process.env.NODE_ENV || 'development');
  
  try {
    // Test 1: Basic connection
    console.log('\n1️⃣ Testing basic connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully!');
    
    // Test 2: Check if Events table exists
    console.log('\n2️⃣ Testing table existence...');
    const tableExists = await sequelize.getQueryInterface().showAllTables();
    console.log('📋 Available tables:', tableExists);
    
    if (tableExists.includes('Events')) {
      console.log('✅ Events table exists!');
      
      // Test 3: Count records
      console.log('\n3️⃣ Testing record count...');
      const count = await Event.count();
      console.log(`📊 Total records in Events table: ${count}`);
      
      // Test 4: Fetch a few records
      console.log('\n4️⃣ Testing data retrieval...');
      const sampleEvents = await Event.findAll({
        limit: 3,
        order: [['event_date', 'DESC']]
      });
      
      console.log('📝 Sample records:');
      sampleEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.event_name} (${event.event_date})`);
      });
      
      // Test 5: Test a simple query
      console.log('\n5️⃣ Testing query performance...');
      const startTime = Date.now();
      await Event.findOne({ where: { event_type: 'Thanksgiving' } });
      const endTime = Date.now();
      console.log(`⚡ Query completed in ${endTime - startTime}ms`);
      
    } else {
      console.log('❌ Events table does not exist!');
      console.log('💡 You may need to run the setup script first.');
    }
    
    console.log('\n🎉 Database test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Provide helpful suggestions
    console.log('\n💡 Troubleshooting suggestions:');
    if (error.message.includes('ECONNREFUSED')) {
      console.log('   - Check if PostgreSQL is running');
      console.log('   - Verify connection parameters in .env file');
    } else if (error.message.includes('authentication')) {
      console.log('   - Check username/password in .env file');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.log('   - Create the database first');
    }
  } finally {
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

if (require.main === module) {
  testDatabase();
}

module.exports = { testDatabase };
