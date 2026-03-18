import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/e-clearance';

async function findOrg() {
    try {
        await mongoose.connect(MONGO_URI, { dbName: 'e-clearance' });
        const Organization = mongoose.model('Organization', new mongoose.Schema({}, { strict: false }));

        const orgs = await Organization.find({});
        console.log("Orgs in DB:", orgs.length);
        orgs.forEach((o: any) => console.log(`- ${o.name} (${o._id}), JoinCode: ${o.joinCode}`));

        const org = await Organization.findOne({ joinCode: 'JHA6J4' });
        if (org) {
            console.log("Found Organization ID:", org._id);
        } else {
            console.log("Organization with joinCode 'JHA6J4' not found.");
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

findOrg();
