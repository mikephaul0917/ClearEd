import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/e-clearance';

async function inspect() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const OrganizationMember = mongoose.model('OrganizationMember', new mongoose.Schema({}, { strict: false }));

        const users = await User.find({});
        console.log("Users in DB:", users.length);
        users.forEach((u: any) => console.log(`- ${u.email} (${u._id})`));

        const user = await User.findOne({ email: 'student@dummy.edu' });
        if (!user) {
            console.log("User 'student@dummy.edu' not found");
            return;
        }
        console.log("User ID:", user._id);

        const memberships = await OrganizationMember.find({ userId: user._id });
        console.log("Memberships found:", memberships.length);
        memberships.forEach((m: any) => {
            console.log(`- Org: ${m.organizationId}, Role: ${m.role}, Status: ${m.status}`);
        });

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

inspect();
