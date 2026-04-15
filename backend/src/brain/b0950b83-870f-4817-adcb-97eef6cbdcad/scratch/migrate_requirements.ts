import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/e-clearance';

async function migrate() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const Term = mongoose.model('Term', new mongoose.Schema({ institutionId: mongoose.Schema.Types.ObjectId, isActive: Boolean }));
    const ClearanceRequirement = mongoose.model('ClearanceRequirement', new mongoose.Schema({ termId: mongoose.Schema.Types.ObjectId, institutionId: mongoose.Schema.Types.ObjectId }));

    console.log('Fetching all active terms...');
    const activeTerms = await Term.find({ isActive: true });
    console.log(`Found ${activeTerms.length} active terms.`);

    for (const term of activeTerms) {
        console.log(`Processing institution: ${term.institutionId} with term: ${term._id}`);
        // Update requirements for this institution that don't have a termId
        const result = await ClearanceRequirement.updateMany(
            { institutionId: term.institutionId, termId: { $exists: false } },
            { $set: { termId: term._id } }
        );
        console.log(`Updated ${result.modifiedCount} requirements.`);
    }

    // Also handle any stray requirements (maybe assign to first available term?)
    // But safely, we just handled the main ones.

    console.log('Migration complete.');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
