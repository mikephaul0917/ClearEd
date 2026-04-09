import cron from 'node-cron';
import { Institution } from '../models/Institution';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { InstitutionRequest } from '../models/InstitutionRequest';

/**
 * Executes a daily check at midnight to permanently delete any institutions
 * (and their associated users) that have been suspended for more than 30 days.
 */
export const startStaleInstitutionCleanupJob = () => {
  // Run automatically every day at midnight (00:00)
  cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cron job: deleteStaleInstitutions');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const staleInstitutions = await Institution.find({
        status: 'suspended',
        suspendedAt: { $lte: thirtyDaysAgo }
      });

      if (staleInstitutions.length === 0) {
        console.log('No stale suspended institutions found for deletion.');
        return;
      }

      console.log(`Found ${staleInstitutions.length} stale suspended institutions. Initiating cascade delete.`);

      for (const institution of staleInstitutions) {
        const institutionName = institution.name;
        const institutionId = institution._id;

        // Cascade delete users linked to the institution
        const deletedUsersResult = await User.deleteMany({ institutionId: institutionId });
        
        // Cascade delete InstitutionRequest to unlock domain registration
        await InstitutionRequest.deleteMany({ academicDomain: institution.domain });

        // Delete the institution document entirely
        await Institution.findByIdAndDelete(institutionId);

        // Record a system-level audit log describing the automated action
        await AuditLog.create({
          userId: null, // System Action
          institutionId: institutionId,
          action: 'AUTO_PERMANENT_DELETE_INSTITUTION',
          resource: 'Institution',
          details: `System automatically pruned institution: ${institutionName} after 30 days of suspension. Also removed ${deletedUsersResult.deletedCount} associated users.`,
          ipAddress: 'system-cron',
          userAgent: 'node-cron',
          severity: 'critical',
          category: 'institution_management'
        });

        console.log(`Successfully hard-deleted institution: ${institutionName}`);
      }
    } catch (error) {
      console.error('Error executing deleteStaleInstitutions cron job:', error);
    }
  });

  console.log('Cron Job Initialized: Stale Institution Cleanup (runs daily at midnight)');
};
