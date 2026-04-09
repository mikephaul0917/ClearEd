import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { InstitutionRequest } from './src/models/InstitutionRequest';
import { Institution } from './src/models/Institution';

dotenv.config();

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('Connected to DB');

    // Find all requests
    const allRequests = await InstitutionRequest.find({});
    console.log(`Found ${allRequests.length} total institution requests`);

    for (const req of allRequests) {
      if (req.status === 'APPROVED') {
        const matchingInst = await Institution.findOne({ domain: req.academicDomain });
        if (!matchingInst) {
          console.log(`Deleting orphan request for domain: ${req.academicDomain}`);
          await InstitutionRequest.deleteOne({ _id: req._id });
        }
      } else if (req.status === 'PENDING_VERIFICATION' || req.status === 'PENDING_APPROVAL' || req.status === 'REJECTED') {
          // If we want to clean up ANY domain that was rejected or is stuck...
          // Let's specifically look for shc.edu.ph
          if (req.academicDomain === 'shc.edu.ph') {
              console.log(`Deleting request for shc.edu.ph with status ${req.status}`);
              await InstitutionRequest.deleteOne({ _id: req._id });
          }
      }
    }

    console.log('Cleanup complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
