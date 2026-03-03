const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error checking MongoDB connection: ${error.message}`);
    // Rethrow to let server.js handle it
    throw error;
  }
};

module.exports = connectDB;
