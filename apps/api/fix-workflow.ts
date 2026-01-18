// Script to fix workflow step linkage in the 'test' database
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://harshitmrsharma_db_user:IHufWp6mQfMkahl6@cluster0.xxh0z36.mongodb.net/test';

async function fixWorkflows() {
    try {
        console.log('Connecting to MongoDB (test database)...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            console.log('Database connection not ready');
            process.exit(1);
        }

        // Get all workflows
        const workflows = await db.collection('workflows').find({}).toArray();
        console.log(`\nFound ${workflows.length} workflows\n`);

        for (const workflow of workflows) {
            console.log('========================================');
            console.log('Workflow:', workflow.name);
            console.log('ID:', workflow._id.toString());

            if (workflow.steps && workflow.steps.length > 0) {
                console.log('\nBefore fix:');
                workflow.steps.forEach((step: any, i: number) => {
                    console.log(`  ${i + 1}. ${step.name} (${step.type}) -> next: ${step.nextStepId || 'NONE'}`);
                });

                // Check if any step is missing nextStepId
                let needsFix = false;
                for (let i = 0; i < workflow.steps.length - 1; i++) {
                    if (!workflow.steps[i].nextStepId) {
                        needsFix = true;
                        break;
                    }
                }

                if (needsFix) {
                    console.log('\n⚠️ Fixing step linkage...');

                    const fixedSteps = workflow.steps.map((step: any, index: number) => {
                        if (index < workflow.steps.length - 1) {
                            return {
                                ...step,
                                nextStepId: workflow.steps[index + 1].id
                            };
                        }
                        return { ...step, nextStepId: null };
                    });

                    await db.collection('workflows').updateOne(
                        { _id: workflow._id },
                        { $set: { steps: fixedSteps } }
                    );

                    console.log('\nAfter fix:');
                    fixedSteps.forEach((step: any, i: number) => {
                        console.log(`  ${i + 1}. ${step.name} (${step.type}) -> next: ${step.nextStepId || 'LAST STEP'}`);
                    });
                    console.log('\n✅ Fixed!');
                } else {
                    console.log('\n✅ Already properly linked');
                }
            }
        }

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixWorkflows();
