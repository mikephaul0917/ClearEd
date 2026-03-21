const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/src/controllers/clearanceItemController.ts');
let dt = fs.readFileSync(filePath, 'utf8');

const targetStr = `    // 3. Map requirements to submission status
    const requirementsWithStatus = requirements.map(reqItem => {
      const submission = submissions.find(sub => sub.clearanceRequirementId.toString() === (reqItem as any)._id.toString());
      return {
        ...reqItem.toObject(),
        submission: submission ? {
          id: submission._id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          files: submission.files,
          notes: submission.notes,
          rejectionReason: submission.rejectionReason,
          reviewedAt: submission.reviewedAt
        } : null
      };
    });`;

const replaceStr = `    // 3. Fetch stats if officer
    let stats: any[] = [];
    let totalMembers = 0;
    if (isOfficer) {
      stats = await ClearanceSubmission.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId as string) } },
        { $group: { _id: { requirementId: "$clearanceRequirementId", status: "$status" }, count: { $sum: 1 } } }
      ]);
      totalMembers = await OrganizationMember.countDocuments({
        organizationId: new mongoose.Types.ObjectId(organizationId as string),
        role: "member",
        status: "active"
      });
    }

    // 4. Map requirements to submission status
    const requirementsWithStatus = requirements.map(reqItem => {
      const reqIdStr = (reqItem as any)._id.toString();
      const submission = submissions.find(sub => sub.clearanceRequirementId.toString() === reqIdStr);
      
      let reqStats = undefined;
      if (isOfficer) {
        const rStats = stats.filter(s => s._id.requirementId && s._id.requirementId.toString() === reqIdStr);
        reqStats = {
          pending: rStats.find(s => s._id.status === 'pending')?.count || 0,
          approved: rStats.find(s => s._id.status === 'approved')?.count || 0,
          rejected: rStats.find(s => s._id.status === 'rejected')?.count || 0,
          resubmission_required: rStats.find(s => s._id.status === 'resubmission_required')?.count || 0,
          totalMembers
        };
      }

      return {
        ...reqItem.toObject(),
        submission: submission ? {
          id: submission._id,
          status: submission.status,
          submittedAt: submission.submittedAt,
          files: submission.files,
          notes: submission.notes,
          rejectionReason: submission.rejectionReason,
          reviewedAt: submission.reviewedAt
        } : null,
        stats: reqStats
      };
    });`;

if (dt.includes(targetStr)) {
    dt = dt.replace(targetStr, replaceStr);
    fs.writeFileSync(filePath, dt);
    console.log("Successfully patched clearanceItemController.ts");
} else {
    console.error("Target string not found in clearanceItemController.ts! Make sure exact spacing matches.");
}
