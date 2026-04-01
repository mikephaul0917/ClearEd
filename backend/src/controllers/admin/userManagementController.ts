import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../../models/User";
import Institution from "../../models/Institution";
import Organization from "../../models/Organization";
import ClearanceRequirement from "../../models/ClearanceRequirement";
import Term from "../../models/Term";
import ClearanceRequest from "../../models/ClearanceRequest";
import ClearanceSubmission from "../../models/ClearanceSubmission";
import OrganizationMember from "../../models/OrganizationMember";
import StudentProfile from "../../models/StudentProfile";
import DeanAssignment from "../../models/DeanAssignment";
import { logAudit } from "../../utils/auditLogger";


const resolveInstitutionId = (req: Request) => {
  const user = (req as any).user;
  if (!user) return null;
  if (user.role === 'super_admin') {
    return req.query.institutionId || req.body.institutionId || user.institutionId;
  }
  return user.institutionId;
};

/**
 * User Management for Institution Admins
 */

export const listUsers = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    if (!institutionId) return res.status(401).json({ message: "Unauthorized" });

    const users = await User.find({ institutionId }, { password: 0 });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const institutionId = resolveInstitutionId(req);
    const user = await User.findOne({ _id: id, institutionId }, { password: 0 });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch active officer memberships
    const memberships = await OrganizationMember.find({ 
      userId: id, 
      institutionId, 
      role: 'officer', 
      status: 'active' 
    });
    
    const organizationIds = memberships.map(m => m.organizationId);

    res.json({
      ...user.toObject(),
      organizationIds
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    console.log('[DEBUG] createUser request body:', req.body);
    console.log('[DEBUG] createUser req.user:', (req as any).user);

    const { email, password, fullName, role, organizationId, organizationIds } = req.body;
    const institutionId = resolveInstitutionId(req);

    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ message: "Email already used" });

    // Note: Password hashing is handled by User model pre-save hook
    const user = await User.create({
      email: email.toLowerCase(),
      password,
      fullName,
      role,
      institutionId,
      organizationId: organizationId || (organizationIds && organizationIds.length > 0 ? organizationIds[0] : undefined),
      status: 'active',
      enabled: true
    });

    // Handle OrganizationMember synchronization for officers (Multi-org support)
    const targetOrgIds = organizationIds || (organizationId ? [organizationId] : []);
    if (role === 'officer' && targetOrgIds.length > 0) {
      for (const orgId of targetOrgIds) {
        await OrganizationMember.findOneAndUpdate(
          { userId: user._id, organizationId: orgId, institutionId },
          { role: 'officer', status: 'active', joinedAt: new Date() },
          { upsert: true, new: true }
        );
      }
    }

    res.status(201).json({
      message: "User created",
      user: { id: user._id, email: user.email, role: user.role, fullName: user.fullName, avatarUrl: user.avatarUrl }
    });
  } catch (error: any) {
    console.error('[CreateUser Error]:', error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({ message: `Validation Error: ${messages.join(', ')}` });
    }

    // Handle duplicate key errors (Mongo error code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `Conflict: ${field} already exists.` });
    }

    res.status(500).json({ message: `Server Error: ${error.message}` });
  }
};

export const updateStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { enabled, status } = req.body;
    const institutionId = resolveInstitutionId(req);

    const user = await User.findOne({ _id: id, institutionId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldStatus = user.status;
    const oldEnabled = user.enabled;

    if (enabled !== undefined) user.enabled = !!enabled;
    if (status) user.status = status;
    await user.save();

    await logAudit({
      userId: (req as any).user?.id,
      institutionId,
      action: 'USER_STATUS_UPDATED',
      category: 'user_management',
      resource: 'User',
      resourceId: user._id as any,
      details: {
        targetUserId: user._id,
        oldStatus, newStatus: user.status,
        oldEnabled, newEnabled: user.enabled
      },
      severity: 'medium',
      req
    });

    res.json({ message: "Status updated", enabled: user.enabled, status: user.status });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBulkStatus = async (req: Request, res: Response) => {
  try {
    const { userIds, enabled } = req.body;
    const institutionId = resolveInstitutionId(req);

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No user IDs provided" });
    }

    const result = await User.updateMany(
      { _id: { $in: userIds }, institutionId },
      { $set: { enabled: !!enabled } }
    );

    await logAudit({
      userId: (req as any).user?.id,
      institutionId,
      action: 'BULK_USER_STATUS_UPDATED',
      category: 'user_management',
      resource: 'User',
      resourceId: null as any,
      details: {
        userIdCount: userIds.length,
        newEnabled: !!enabled,
        targetUserIds: userIds
      },
      severity: 'medium',
      req
    });

    res.json({ message: `Successfully updated ${result.modifiedCount} users`, count: result.modifiedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role, organizationId, organizationIds } = req.body;
    const institutionId = resolveInstitutionId(req);
    const adminRole = (req as any).user?.role;

    // 1. Validate role input
    const validRoles = ["student", "officer", "dean", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    // 2. Prevent non-super_admins from assigning super_admin
    if (role === 'super_admin' && adminRole !== 'super_admin') {
      return res.status(403).json({ message: "You don't have permission to assign the Super Admin role." });
    }

    const user = await User.findOne({ _id: id, institutionId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldRole = user.role;
    user.role = role;
    
    const targetOrgIds = organizationIds || (organizationId ? [organizationId] : []);
    
    // Maintain single organizationId in User model for backward compatibility (using first in array)
    if (organizationId !== undefined) {
      (user as any).organizationId = organizationId || null;
    } else if (organizationIds !== undefined) {
      (user as any).organizationId = organizationIds.length > 0 ? organizationIds[0] : null;
    }
    
    await user.save();

    await logAudit({
      userId: (req as any).user?.id,
      institutionId,
      action: 'USER_ROLE_UPDATED',
      category: 'user_management',
      resource: 'User',
      resourceId: user._id as any,
      details: {
        targetUserId: user._id,
        oldRole, newRole: user.role,
        organizationIds: targetOrgIds
      },
      severity: 'high',
      req
    });

    // Officer Role Synchronization Logic (Multi-org support):
    if (role === 'officer') {
      // 1. Deactivate memberships NOT in the new list
      if (targetOrgIds.length > 0) {
        await OrganizationMember.updateMany(
          { 
            userId: user._id, 
            institutionId, 
            role: 'officer',
            organizationId: { $nin: targetOrgIds } 
          },
          { status: 'removed', role: 'member', statusChangedAt: new Date() }
        );

        // 2. Add/Update memberships IN the new list
        for (const orgId of targetOrgIds) {
          await OrganizationMember.findOneAndUpdate(
            { userId: user._id, organizationId: orgId, institutionId },
            { role: 'officer', status: 'active', joinedAt: new Date(), statusChangedAt: new Date() },
            { upsert: true, new: true }
          );
        }
      } else {
        // No organizations assigned, remove all officer status
        await OrganizationMember.updateMany(
          { userId: user._id, institutionId, role: 'officer' },
          { status: 'removed', role: 'member', statusChangedAt: new Date() }
        );
      }
    }
    // 3. If changing FROM officer to something else, remove all officer status
    else if (oldRole === 'officer' && role !== 'officer') {
      await OrganizationMember.updateMany(
        { userId: user._id, institutionId, role: 'officer' },
        { status: 'removed', role: 'member', statusChangedAt: new Date() }
      );
    }
    
    // Dean Role Synchronization Logic:
    // If changing FROM dean to something else, remove all their course assignments
    if (oldRole === 'dean' && role !== 'dean') {
      await DeanAssignment.deleteMany({ deanId: user._id, institutionId });
    }

    res.json({ message: "Role updated", role: user.role });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBulkRole = async (req: Request, res: Response) => {
  try {
    const { userIds, role, organizationIds } = req.body;
    const institutionId = resolveInstitutionId(req);
    const adminRole = (req as any).user?.role;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "No user IDs provided" });
    }

    // 1. Validate role input
    const validRoles = ["student", "officer", "dean", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    // 2. Prevent non-super_admins from assigning super_admin
    if (role === 'super_admin' && adminRole !== 'super_admin') {
      return res.status(403).json({ message: "You don't have permission to assign the Super Admin role." });
    }

    const payload: any = { role };
    const targetOrgIds = organizationIds || [];
    
    if (targetOrgIds.length > 0) {
      payload.organizationId = targetOrgIds[0];
    } else {
      payload.organizationId = null;
    }

    // Update the basic User record for all
    const result = await User.updateMany(
      { _id: { $in: userIds }, institutionId },
      { $set: payload }
    );

    // Now handle the complex role synchronization for EACH user
    // Since this is a bulk operation, we'll iterate through userIds for the relationship sync
    // This is necessary because of the specialized logic for deans and officers
    for (const userId of userIds) {
      // Officer Role Synchronization Logic:
      if (role === 'officer') {
        if (targetOrgIds.length > 0) {
          await OrganizationMember.updateMany(
            { 
              userId, 
              institutionId, 
              role: 'officer',
              organizationId: { $nin: targetOrgIds } 
            },
            { status: 'removed', role: 'member', statusChangedAt: new Date() }
          );

          for (const orgId of targetOrgIds) {
            await OrganizationMember.findOneAndUpdate(
              { userId, organizationId: orgId, institutionId },
              { role: 'officer', status: 'active', joinedAt: new Date(), statusChangedAt: new Date() },
              { upsert: true, new: true }
            );
          }
        } else {
          await OrganizationMember.updateMany(
            { userId, institutionId, role: 'officer' },
            { status: 'removed', role: 'member', statusChangedAt: new Date() }
          );
        }
      }
      else if (role !== 'officer') {
        // If they were an officer before, remove it
        await OrganizationMember.updateMany(
          { userId, institutionId, role: 'officer' },
          { status: 'removed', role: 'member', statusChangedAt: new Date() }
        );
      }

      // Dean Role Synchronization:
      if (role !== 'dean') {
        await DeanAssignment.deleteMany({ deanId: userId, institutionId });
      }
    }

    await logAudit({
      userId: (req as any).user?.id,
      institutionId,
      action: 'BULK_USER_ROLE_UPDATED',
      category: 'user_management',
      resource: 'User',
      resourceId: null as any,
      details: {
        userIdCount: userIds.length,
        newRole: role,
        organizationIds: targetOrgIds,
        targetUserIds: userIds
      },
      severity: 'high',
      req
    });

    res.json({ message: `Successfully updated ${result.modifiedCount} users`, count: result.modifiedCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, username } = req.body;
    const institutionId = resolveInstitutionId(req);

    const user = await User.findOne({ _id: id, institutionId });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;

    await user.save();

    await logAudit({
      userId: (req as any).user?.id,
      institutionId,
      action: 'USER_PROFILE_UPDATED',
      category: 'user_management',
      resource: 'User',
      resourceId: user._id as any,
      details: {
        targetUserId: user._id,
        updatedFields: { fullName, username }
      },
      severity: 'medium',
      req
    });

    res.json({ message: "Profile updated", user: { fullName: user.fullName, username: user.username, avatarUrl: user.avatarUrl } });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Student Profile Management
 */

export const getStudentProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const institutionId = resolveInstitutionId(req);

    const profile = await StudentProfile.findOne({ userId: id, institutionId });
    // It's perfectly fine if profile is null (e.g. they are an officer but not a student)
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateStudentProfile = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isStudent, course, yearLevel } = req.body;
    const institutionId = resolveInstitutionId(req);

    if (isStudent === false) {
      await StudentProfile.findOneAndDelete({ userId: id, institutionId });
      return res.json({ message: "Student profile removed" });
    }

    if (!course || !yearLevel) {
      return res.status(400).json({ message: "Course and Year Level are required." });
    }

    // Ensure they have an active term for defaults
    const activeTerm = await Term.findOne({ institutionId, isActive: true });
    
    const profile = await StudentProfile.findOneAndUpdate(
      { userId: id, institutionId },
      {
        course,
        year: yearLevel,
        academicYear: activeTerm?.academicYear || "2024-2025",
        semester: activeTerm?.semester || "1st Semester"
      },
      { new: true, upsert: true }
    );

    res.json({ message: "Student profile updated", profile });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Dean Assignment Management
 */

export const getDeanAssignments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const institutionId = resolveInstitutionId(req);
    
    const assignments = await DeanAssignment.find({ deanId: id, institutionId }).sort({ course: 1, yearLevel: 1 });
    res.json(assignments);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const addDeanAssignment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { course, yearLevel } = req.body;
    const institutionId = resolveInstitutionId(req);

    if (!course) {
      return res.status(400).json({ message: "Course is required." });
    }

    const assignment = await DeanAssignment.create({
      deanId: id,
      institutionId,
      course,
      yearLevel: yearLevel || "All"
    });

    res.status(201).json({ message: "Dean assignment added", assignment });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "This course and year level are already assigned to this Dean." });
    }
    res.status(500).json({ message: error.message });
  }
};

export const removeDeanAssignment = async (req: Request, res: Response) => {
  try {
    const { id, assignmentId } = req.params;
    const institutionId = resolveInstitutionId(req);

    const assignment = await DeanAssignment.findOneAndDelete({ _id: assignmentId, deanId: id, institutionId });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found." });
    }

    res.json({ message: "Assignment removed" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Organization Management
 */

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    const { name, code, description, type, approvalOrder } = req.body;

    const org = await Organization.create({
      name,
      code: code || name.toUpperCase().replace(/\s+/g, '_'),
      description,
      type: type || 'office',
      institutionId,
      approvalOrder: approvalOrder || 0,
      isActive: true
    });

    res.status(201).json({ message: "Organization created", organization: org });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listOrganizations = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    const orgs = await Organization.find({ institutionId, isDeleted: false }).sort({ approvalOrder: 1 });
    res.json(orgs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Clearance Requirement (formerly Item) Management
 */

export const createRequirement = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    const { organizationId, title, description, requiredFiles, isMandatory } = req.body;

    const reqDoc = await ClearanceRequirement.create({
      organizationId,
      institutionId,
      title,
      description,
      requiredFiles: requiredFiles || [],
      isMandatory: isMandatory !== false,
      isActive: true
    } as any);

    res.status(201).json({ message: "Requirement created", requirement: reqDoc });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const listRequirements = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    const { organizationId } = req.query;

    const query: any = { institutionId };
    if (organizationId) query.organizationId = organizationId;

    const reqs = await ClearanceRequirement.find(query).populate('organizationId', 'name');
    res.json(reqs);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, requiredFiles, isMandatory, isActive } = req.body;
    const institutionId = resolveInstitutionId(req);

    const reqDoc = await ClearanceRequirement.findOne({ _id: id, institutionId });
    if (!reqDoc) return res.status(404).json({ message: "Requirement not found" });

    if (title !== undefined) reqDoc.title = title;
    if (description !== undefined) reqDoc.description = description;
    if (requiredFiles !== undefined) (reqDoc as any).requiredFiles = requiredFiles;
    if (isMandatory !== undefined) (reqDoc as any).isMandatory = !!isMandatory;
    if (isActive !== undefined) reqDoc.isActive = !!isActive;

    await reqDoc.save();
    res.json({ message: "Requirement updated" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRequirement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const institutionId = resolveInstitutionId(req);

    const reqDoc = await ClearanceRequirement.findOneAndDelete({ _id: id, institutionId });
    if (!reqDoc) return res.status(404).json({ message: "Requirement not found" });

    res.json({ message: "Requirement deleted" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Term Management
 */

export const createTerm = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    const { name, academicYear, semester, isActive } = req.body;

    // Ensure only one active term per institution
    if (isActive) {
      await Term.updateMany({ institutionId }, { isActive: false });
    }

    const term = await Term.create({
      name,
      academicYear,
      semester,
      institutionId,
      isActive: !!isActive
    });

    res.status(201).json({ message: "Term created", term });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const activateTerm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const institutionId = resolveInstitutionId(req);

    // Deactivate all terms for this institution
    await Term.updateMany({ institutionId }, { isActive: false });

    // Activate the selected term
    const term = await Term.findOneAndUpdate(
      { _id: id, institutionId },
      { isActive: true },
      { new: true }
    );

    if (!term) return res.status(404).json({ message: "Term not found" });

    await logAudit({
      userId: (req as any).user?.id,
      institutionId,
      action: 'TERM_ACTIVATED',
      category: 'system',
      resource: 'Term',
      resourceId: term._id as any,
      details: { termId: id, academicYear: term.academicYear, semester: term.semester },
      severity: 'high',
      req
    });

    res.json({ message: "Term activated successfully", term });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTerm = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const institutionId = resolveInstitutionId(req);

    const term = await Term.findOneAndDelete({ _id: id, institutionId });
    if (!term) return res.status(404).json({ message: "Term not found" });

    await logAudit({
      userId: (req as any).user?.id,
      institutionId,
      action: 'TERM_DELETED',
      category: 'system',
      resource: 'Term',
      resourceId: term._id as any,
      details: { academicYear: term.academicYear, semester: term.semester },
      severity: 'medium',
      req
    });

    res.json({ message: "Term deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Statistics and Analytics
 */

export const getClearanceStats = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);

    const totalRequests = await ClearanceRequest.countDocuments({ institutionId });
    const completedRequests = await ClearanceRequest.countDocuments({ institutionId, status: 'completed' });
    const pendingRequests = await ClearanceRequest.countDocuments({ institutionId, status: 'pending' });

    const orgs = await Organization.find({ institutionId, status: 'active' });
    
    // Determine the review latencies for all approved submissions
    const approvedSubmissions = await ClearanceSubmission.find({
      institutionId,
      status: 'approved',
      reviewedAt: { $exists: true }
    });

    const orgStatsMap: Record<string, { count: number; totalDelayDays: number; }> = {};
    orgs.forEach(o => {
      orgStatsMap[String(o._id)] = { count: 0, totalDelayDays: 0 };
    });

    approvedSubmissions.forEach(sub => {
      const orgId = sub.organizationId?.toString();
      if (!orgId || !orgStatsMap[orgId]) return;
      
      const start = sub.lastResubmittedAt || sub.submittedAt;
      const end = sub.reviewedAt as Date;
      
      if (start && end) {
        const delayMs = end.getTime() - start.getTime();
        const delayDays = Math.max(0, delayMs / (1000 * 60 * 60 * 24)); // clamp negative to 0
        orgStatsMap[orgId].count += 1;
        orgStatsMap[orgId].totalDelayDays += delayDays;
      }
    });

    const organizationApprovals: { name: string; count: number; avgDays: number }[] = [];
    orgs.forEach(o => {
      const stat = orgStatsMap[String(o._id)];
      const avgDays = stat.count > 0 ? Math.round(stat.totalDelayDays / stat.count) : 0;
      organizationApprovals.push({ name: o.name, count: stat.count, avgDays });
    });

    // Find the extremes for delay
    const activeOrgs = organizationApprovals.filter(o => o.count > 0);
    
    let fastest = { name: "—", avgDays: 0 };
    let mostDelayed = { name: "—", avgDays: 0 };

    if (activeOrgs.length > 0) {
      activeOrgs.sort((a, b) => a.avgDays - b.avgDays);
      fastest = { name: activeOrgs[0].name, avgDays: activeOrgs[0].avgDays };
      mostDelayed = { name: activeOrgs[activeOrgs.length - 1].name, avgDays: activeOrgs[activeOrgs.length - 1].avgDays };
    }

    // Dynamic fake volume for aesthetic chart flow
    const volume = {
      day: [2, 4, 3, 5, 2, 7, 8, 4],
      week: [20, 35, 40, 55, 60, 45, 70],
      month: [120, 150, 200, 180, 250, 300]
    };

    res.json({
      totalRequests,
      completedRequests,
      pendingRequests,
      rejectedRequests: 0,
      organizationApprovals: organizationApprovals.sort((a, b) => b.count - a.count), // render chart largest to smallest
      fastest,
      mostDelayed,
      volume
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getInstitution = async (req: Request, res: Response) => {
  try {
    const institutionId = resolveInstitutionId(req);
    if (!institutionId) return res.status(401).json({ message: "Unauthorized" });

    const institution = await Institution.findById(institutionId);
    if (!institution) return res.status(404).json({ message: "Institution not found" });

    res.json(institution);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
