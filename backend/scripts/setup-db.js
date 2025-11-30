const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
  console.log('🔧 Setting up database...');

  // Create database connection (without specifying database name)
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres' // Connect to default postgres database first
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create database if it doesn't exist
    try {
      await client.query('CREATE DATABASE campus_connect_db');
      console.log('✅ Database "campus_connect_db" created');
    } catch (error) {
      if (error.code === '42P04') {
        console.log('ℹ️  Database "campus_connect_db" already exists');
      } else {
        throw error;
      }
    }

    await client.end();

    // Now connect to the specific database
    const dbClient = new Client({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    await dbClient.connect();
    console.log('✅ Connected to campus_connect_db');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing schema...');
    await dbClient.query(schemaSQL);
    console.log('✅ Database schema created successfully');

    await dbClient.end();
    console.log('🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('\n🚀 Next steps:');
      console.log('1. Run: npm run seed');
      console.log('2. Run: npm run dev (to start the server)');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
