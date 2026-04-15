import cron from 'node-cron';
import Term from '../models/Term';

/**
 * Automatically manages Academic Term activation based on scheduled Date & Time
 * Runs every minute to ensure precise transitions
 */
export const initTermScheduler = () => {
    console.log('[SYSTEM] Initializing Automatic Term Scheduler...');

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            
            // 1. AUTO-ACTIVATION: Find terms that should be active NOW
            const termsToActivate = await Term.find({
                isActive: false,
                startDate: { $lte: now },
                endDate: { $gte: now }
            });

            for (const term of termsToActivate) {
                // Ensure institution exclusivity: de-activate any currently active terms
                await Term.updateMany(
                    { institutionId: term.institutionId, _id: { $ne: term._id } },
                    { isActive: false }
                );
                
                term.isActive = true;
                await term.save();

                console.log(`[SCHEDULE] AUTO-ACTIVATED: ${term.academicYear} ${term.semester} (ID: ${term._id})`);
            }

            // 2. AUTO-DEACTIVATION: Find terms that have EXPIRED or are out of bounds
            const termsToDeactivate = await Term.find({
                isActive: true,
                $or: [
                    { endDate: { $lt: now } },
                    { startDate: { $gt: now } }
                ]
            });

            for (const term of termsToDeactivate) {
                term.isActive = false;
                await term.save();
                console.log(`[SCHEDULE] AUTO-DEACTIVATED (EXPIRED): ${term.academicYear} ${term.semester} (ID: ${term._id})`);
            }

        } catch (error: any) {
            console.error('[TermScheduler CRON Error]:', error.message);
        }
    });
};
