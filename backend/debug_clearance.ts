import mongoose from 'mongoose';
import { getOrganizationClearanceOverview } from './src/controllers/clearanceWorkflowController';
import dotenv from 'dotenv';
import './src/models/User';
import './src/models/Organization';
import './src/models/Term';
import './src/models/ClearanceRequirement';
import './src/models/OrganizationMember';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://banderada_db_user:banderada@api.i4z6szt.mongodb.net/', { dbName: 'e-clearance' }).then(async () => {
    try {
        const req = {
            params: { organizationId: '69a3b68d9230a5fa343a9a3d' },
            user: { institutionId: '69a18e496917b308bf0fe8c8' }
        } as any;
        
        const res = {
            status: (code: number) => ({
                json: (data: any) => {
                    console.log('STATUS:', code);
                    console.log('JSON:', JSON.stringify(data, null, 2));
                    process.exit(0);
                }
            }),
            json: (data: any) => {
                console.log('JSON 200:', JSON.stringify(data, null, 2));
                process.exit(0);
            }
        } as any;

        await getOrganizationClearanceOverview(req, res);
    } catch (err) {
        console.error('ERROR:', err);
        process.exit(1);
    }
});
