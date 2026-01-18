// Script to view and fix email step config in workflows
import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb+srv://harshitmrsharma_db_user:IHufWp6mQfMkahl6@cluster0.xxh0z36.mongodb.net/test';

async function fixEmailStep() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            console.log('Database connection not ready');
            process.exit(1);
        }

        // Get all workflows
        const workflows = await db.collection('workflows').find({}).toArray();

        for (const workflow of workflows) {
            console.log('\n========================================');
            console.log('Workflow:', workflow.name);

            if (workflow.steps) {
                let aiStepId = '';
                let emailStepIndex = -1;

                // First find the AI step ID
                workflow.steps.forEach((step: any, index: number) => {
                    console.log(`\nStep ${index + 1}: ${step.name} (${step.type})`);
                    console.log('  ID:', step.id);
                    console.log('  Config:', JSON.stringify(step.config, null, 2));

                    if (step.type === 'ai_process') {
                        aiStepId = step.id;
                    }
                    if (step.type === 'email') {
                        emailStepIndex = index;
                    }
                });

                // Now fix the email step to include AI output
                if (emailStepIndex >= 0 && aiStepId) {
                    console.log('\n⚠️ Updating email step to include AI results...');

                    const emailStep = workflow.steps[emailStepIndex];
                    const updatedConfig = {
                        ...emailStep.config,
                        to: emailStep.config?.to || 'harshitmrsharma@gmail.com',
                        subject: 'Invoice Analysis Results',
                        body: `Your document has been analyzed by AI.\n\nResults:\n{{${aiStepId}}}\n\nProcessed at: {{timestamp}}`
                    };

                    workflow.steps[emailStepIndex].config = updatedConfig;

                    await db.collection('workflows').updateOne(
                        { _id: workflow._id },
                        { $set: { steps: workflow.steps } }
                    );

                    console.log('✅ Email step updated!');
                    console.log('New email config:', JSON.stringify(updatedConfig, null, 2));
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

fixEmailStep();
