// Script to list ALL databases and find where workflows are
import mongoose from 'mongoose';

// Use the exact URI from .env (without database name)
const MONGODB_URI = 'mongodb+srv://harshitmrsharma_db_user:IHufWp6mQfMkahl6@cluster0.xxh0z36.mongodb.net/';

async function findWorkflows() {
    try {
        console.log('Connecting to MongoDB...');
        // Connect to admin to list databases
        await mongoose.connect(MONGODB_URI + 'admin');
        console.log('Connected to MongoDB');

        const adminDb = mongoose.connection.db;
        if (!adminDb) {
            console.log('Database connection not ready');
            process.exit(1);
        }

        // List all databases
        const result = await adminDb.admin().listDatabases();
        console.log('\nDatabases:');

        for (const database of result.databases) {
            console.log(`\n=== Database: ${database.name} ===`);

            if (database.name === 'admin' || database.name === 'local') continue;

            // Connect to this database and check for workflows
            const conn = await mongoose.createConnection(MONGODB_URI + database.name).asPromise();
            const db = conn.db;

            if (db) {
                const collections = await db.listCollections().toArray();
                for (const col of collections) {
                    const count = await db.collection(col.name).countDocuments();
                    console.log(`  ${col.name}: ${count} documents`);

                    if (col.name === 'workflows' && count > 0) {
                        console.log('\n  *** FOUND WORKFLOWS! ***');
                        const workflows = await db.collection('workflows').find({}).toArray();
                        for (const wf of workflows) {
                            console.log(`\n  Workflow: ${wf.name} (${wf._id})`);
                            console.log(`  Steps: ${wf.steps?.length || 0}`);
                            if (wf.steps) {
                                wf.steps.forEach((step: any, i: number) => {
                                    console.log(`    ${i + 1}. ${step.name} (${step.type}) -> next: ${step.nextStepId || 'NONE'}`);
                                });
                            }
                        }
                    }
                }
            }

            await conn.close();
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

findWorkflows();
