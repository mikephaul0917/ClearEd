import StudentProfile from "../../models/StudentProfile";
import User from "../../models/User";

export const getDashboard = async (_req: Request, res: Response) => {
  res.json({ message: "OK" });
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const profile = await StudentProfile.findOne({ userId, institutionId }).lean();
    const user = await User.findById(userId).select("avatarUrl").lean();
    
    res.json({
      ...(profile || {}),
      avatarUrl: user?.avatarUrl || ""
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const institutionId = (req as any).user?.institutionId;
    if (!userId || !institutionId) return res.status(401).json({ message: "Unauthorized" });

    const {
      familyName,
      firstName,
      middleName,
      studentNumber,
      course,
      year,
      semester,
      academicYear
    } = req.body || {};

    const updateData: any = { ...req.body };
    // Always ensure institutionId is associated if provided in req or already in user session
    if (institutionId) updateData.institutionId = institutionId;

    const profile = await StudentProfile.findOneAndUpdate(
      { userId, institutionId },
      { $set: updateData, userId, institutionId },
      { upsert: true, new: true, runValidators: false }
    );
    res.json({ message: "Student profile saved", profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
