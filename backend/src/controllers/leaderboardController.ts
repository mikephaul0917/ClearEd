import { Request, Response } from "express";
import User from "../models/User";
import ClearanceRequest from "../models/ClearanceRequest";
import ClearanceSubmission from "../models/ClearanceSubmission";
import Term from "../models/Term";
import FinalClearance from "../models/FinalClearance";
import StudentProfile from "../models/StudentProfile";
export const getLeaderboardStats = async (req: Request, res: Response) => {
  try {
    const institutionId = (req as any).user.institutionId;
    if (!institutionId) {
      return res.status(401).json({ message: "No institution context found" });
    }

    const term = await Term.findOne({ institutionId, isActive: true });
    if (!term) {
      return res.json({ success: true, leaderboard: [] });
    }

    // 1. Fetch all qualified base users (students AND officers)
    const baseUsers = await User.find({ 
        institutionId, 
        role: { $in: ['student', 'officer'] }, 
        status: { $nin: ['deleted', 'locked'] },
        enabled: true 
    }).select('fullName username avatarUrl role');

    // Get all student profiles to verify which officers are also students
    const studentProfiles = await StudentProfile.find({ institutionId });
    const studentProfileUserIds = new Set(studentProfiles.map(p => p.userId.toString()));

    const students = baseUsers.filter(user => 
        user.role === 'student' || studentProfileUserIds.has(user._id.toString())
    );

    // 2. Build the leaderboard metrics per student
    const leaderboard = await Promise.all(students.map(async (student) => {
        // Count certifications (completed organization clearances in current term)
        const certCount = await ClearanceRequest.countDocuments({
            userId: student._id,
            termId: term._id,
            status: { $in: ['officer_cleared', 'completed'] }
        });

        // Find FinalClearance
        const finalClearance = await FinalClearance.findOne({
            userId: student._id,
            termId: term._id,
            status: "approved"
        });

        let clearanceDurationStr = "-";
        let rawDurationMs = Infinity; 
        let isCleared = false;

        if (finalClearance && finalClearance.reviewedAt) {
            isCleared = true;
            
            // Find earliest activity (submission or requested)
            const [firstSub, firstReq] = await Promise.all([
                ClearanceSubmission.findOne({ userId: student._id, institutionId, status: { $ne: 'rejected' } }).sort({ submittedAt: 1 }),
                ClearanceRequest.findOne({ userId: student._id, termId: term._id }).sort({ createdAt: 1 })
            ]);

            let start: number | null = null;
            if (firstSub) {
                start = firstSub.submittedAt.getTime();
            } else if (firstReq) {
                start = firstReq.createdAt.getTime();
            }

            if (start) {
                const end = finalClearance.reviewedAt.getTime();
                rawDurationMs = Math.max(0, end - start);

                const hours = Math.floor(rawDurationMs / (1000 * 60 * 60));
                const days = Math.floor(hours / 24);
                const remainingHours = hours % 24;

                if (days > 0) {
                    clearanceDurationStr = `${days}d ${remainingHours}h`;
                } else if (hours > 0) {
                    clearanceDurationStr = `${hours}h`;
                } else {
                    const mins = Math.floor(rawDurationMs / (1000 * 60));
                    clearanceDurationStr = `${mins}m`;
                }
            }
        }

        return {
            _id: student._id,
            user: {
               name: student.fullName || student.username || "Unknown Student",
               avatarUrl: (student as any).avatarUrl || undefined
            },
            certifications: certCount,
            clearanceTime: clearanceDurationStr,
            isCleared,
            rawDurationMs
        };
    }));

    // 3. Sort by: Cleared first (sorted by speed), then not cleared (sorted by certifications descending)
    leaderboard.sort((a, b) => {
       if (a.isCleared && b.isCleared) {
           return a.rawDurationMs - b.rawDurationMs; // Faster time wins
       }
       if (a.isCleared && !b.isCleared) return -1;
       if (!a.isCleared && b.isCleared) return 1;
       
       // Neither cleared, sort by completed org clearances
       return b.certifications - a.certifications;
    });

    // 4. Assign rank formatting
    const rankedLeaderboard = leaderboard.map((item, index) => ({
      rank: index + 1,
      _id: item._id,
      user: item.user,
      certifications: item.certifications,
      clearanceTime: item.clearanceTime,
      status: item.isCleared ? "Cleared" : "In Progress"
    }));

    res.json({ success: true, leaderboard: rankedLeaderboard });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
