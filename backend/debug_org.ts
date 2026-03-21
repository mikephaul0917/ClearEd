import mongoose from 'mongoose';
import Organization from './src/models/Organization';
import OrganizationMember from './src/models/OrganizationMember';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://banderada_db_user:banderada@api.i4z6szt.mongodb.net/e-clearance').then(async () => {
    try {
        const orgId = '69a3b68d9230a5fa343a9a3d';
        console.log('Testing org ID:', orgId);
        
        const org = await Organization.findOne({ _id: orgId });
        console.log('Org via Mongoose:', org ? org.name : 'Not Found!');
        
        const members = await OrganizationMember.find({ organizationId: orgId, role: 'member', status: 'active' }).populate('userId');
        console.log('Members count via Mongoose:', members.length);

        process.exit(0);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
});
