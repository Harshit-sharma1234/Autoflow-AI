// Script to clear all pending/running/failed runs from MongoDB
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://harshitmrsharma_db_user:IHufWp6mQfMkahl6@cluster0.xxh0z36.mongodb.net/test?retryWrites=true&w=majority';

async function clearRuns() {
    try {
        console.log('Connecting to MongoDB...');

        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the runs collection directly
        const db = mongoose.connection.db;
        if (!db) {
            console.log('Database connection not ready');
            process.exit(1);
        }

        // Delete all runs
        const runsResult = await db.collection('runs').deleteMany({});
        console.log(`Deleted ${runsResult.deletedCount} runs`);

        // Also clear AI outputs
        const aiOutputResult = await db.collection('aioutputs').deleteMany({});
        console.log(`Deleted ${aiOutputResult.deletedCount} AI outputs`);

        // Clear run logs
        const runLogsResult = await db.collection('runlogs').deleteMany({});
        console.log(`Deleted ${runLogsResult.deletedCount} run logs`);

        console.log('All queued runs cleared successfully!');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearRuns();
