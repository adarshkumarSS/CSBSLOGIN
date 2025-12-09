const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const fixIndex = async () => {
    await connectDB();
    try {
        const collection = mongoose.connection.collection('meetings');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', indexes);

        // Look for index on tutor_id, month, year
        const targetIndex = indexes.find(idx => idx.key.tutor_id === 1 && idx.key.month === 1 && idx.key.year === 1 && idx.unique === true);
        
        if (targetIndex) {
            console.log(`Found unique index: ${targetIndex.name}. Dropping it...`);
            await collection.dropIndex(targetIndex.name);
            console.log('✅ Unique index dropped successfully.');
        } else {
            console.log('ℹ️ No unique index found on tutor_id + month + year.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

fixIndex();
