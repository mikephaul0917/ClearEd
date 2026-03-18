import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load models
import User from '../../models/User';
import Institution from '../../models/Institution';
import ClearanceRequest from '../../models/ClearanceRequest';
import AuditLog from '../../models/AuditLog';

dotenv.config();

const runTest = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected.');

        const timeRange = '30d';
        const now = new Date();
        const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        console.log('Fetching institution metrics...');
        const [totalInstitutions, activeInstitutions, suspendedInstitutions] = await Promise.all([
            Institution.countDocuments(),
            Institution.countDocuments({ status: 'approved' }),
            Institution.countDocuments({ status: 'suspended' })
        ]);
        console.log('Institutions:', { totalInstitutions, activeInstitutions, suspendedInstitutions });

        console.log('Fetching user metrics...');
        const [totalUsers, studentCount, officerCount, adminCount, deanCount, superAdminCount] = await Promise.all([
            User.countDocuments({ status: { $ne: 'deleted' } }),
            User.countDocuments({ role: 'student', status: { $ne: 'deleted' } }),
            User.countDocuments({ role: 'officer', status: { $ne: 'deleted' } }),
            User.countDocuments({ role: 'admin', status: { $ne: 'deleted' } }),
            User.countDocuments({ role: 'dean', status: { $ne: 'deleted' } }),
            User.countDocuments({ role: 'super_admin', status: { $ne: 'deleted' } })
        ]);
        console.log('Users:', { totalUsers, studentCount, officerCount, adminCount, deanCount, superAdminCount });

        console.log('Fetching clearance metrics...');
        const [totalClearanceRequests, processedClearanceRequests, pendingClearanceRequests] = await Promise.all([
            ClearanceRequest.countDocuments(),
            ClearanceRequest.countDocuments({ status: { $in: ['completed', 'approved', 'rejected'] } }),
            ClearanceRequest.countDocuments({ status: { $in: ['pending', 'in_progress', 'submitted'] } })
        ]);
        console.log('Clearance:', { totalClearanceRequests, processedClearanceRequests, pendingClearanceRequests });

        console.log('Fetching login metrics...');
        const [dailyLogins, weeklyLogins, monthlyLogins] = await Promise.all([
            AuditLog.countDocuments({ action: 'LOGIN', createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }),
            AuditLog.countDocuments({ action: 'LOGIN', createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }),
            AuditLog.countDocuments({ action: 'LOGIN', createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } })
        ]);
        console.log('Logins:', { dailyLogins, weeklyLogins, monthlyLogins });

        console.log('Fetching institution completion rates...');
        const institutions = await Institution.find({ status: 'approved' }).select('_id name').lean();
        console.log(`Found ${institutions.length} approved institutions.`);

        const clearanceCompletionRates = await Promise.all(
            institutions.map(async (institution) => {
                const [totalRequests, completedRequests] = await Promise.all([
                    ClearanceRequest.countDocuments({ institutionId: institution._id, createdAt: { $gte: startDate } }),
                    ClearanceRequest.countDocuments({ institutionId: institution._id, status: { $in: ['completed', 'approved'] }, createdAt: { $gte: startDate } })
                ]);
                return { institutionId: institution._id.toString(), institutionName: institution.name, totalRequests, completedRequests };
            })
        );
        console.log('Completion rates fetched successfully.');

        process.exit(0);
    } catch (error) {
        console.error('FAILED:', error);
        process.exit(1);
    }
};

runTest();
