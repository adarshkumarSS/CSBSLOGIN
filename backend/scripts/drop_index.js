const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/tce-csbs';

const dropIndex = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        const collection = mongoose.connection.collection('meetings');

        // List indexes
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));

        const indexName = 'tutor_id_1_month_1_year_1';

        // Check if index exists
        const indexExists = indexes.some(i => i.name === indexName);

        if (indexExists) {
            console.log(`Dropping index: ${indexName}...`);
            await collection.dropIndex(indexName);
            console.log('Index dropped successfully.');
        } else {
            console.log(`Index ${indexName} not found. It might have already been dropped.`);
        }

        await mongoose.disconnect();
        console.log('Disconnected.');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

dropIndex();
