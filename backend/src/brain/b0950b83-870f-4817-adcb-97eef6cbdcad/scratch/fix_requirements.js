const mongoose = require('mongoose');
const mongoUri = 'mongodb+srv://banderada_db_user:banderada@api.i4z6szt.mongodb.net/';

async function fix() {
    console.log('Connecting...');
    await mongoose.connect(mongoUri, { dbName: 'e-clearance' });
    console.log('Connected.');

    const Term = mongoose.model('Term', new mongoose.Schema({ name: String, createdAt: Date, institutionId: mongoose.Schema.Types.ObjectId }));
    const Req = mongoose.model('ClearanceRequirement', new mongoose.Schema({ title: String, termId: mongoose.Schema.Types.ObjectId, createdAt: Date, institutionId: mongoose.Schema.Types.ObjectId }));

    const terms = await Term.find().sort({ createdAt: 1 });
    const reqs = await Req.find();

    console.log(`Working with ${reqs.length} requirements and ${terms.length} terms.`);

    for (const req of reqs) {
        let bestTerm = null;
        // Find the latest term that was created BEFORE or ON the requirement's creation date
        for (let i = terms.length - 1; i >= 0; i--) {
            if (terms[i].createdAt <= req.createdAt) {
                bestTerm = terms[i];
                break;
            }
        }

        // If no term was created before it, assign to the very first term
        if (!bestTerm && terms.length > 0) {
            bestTerm = terms[0];
        }

        if (bestTerm) {
            // Only update if it doesn't have a term or if we want to ensure it's in the correct historical one
            // Let's force it to the historical one for correctness now
            console.log(`Mapping '${req.title}' (${req.createdAt.toISOString().split('T')[0]}) -> ${bestTerm.name || bestTerm._id}`);
            await Req.updateOne({ _id: req._id }, { $set: { termId: bestTerm._id } });
        }
    }

    console.log('Migration fixed successfully.');
    process.exit(0);
}

fix().catch(err => {
    console.error(err);
    process.exit(1);
});
