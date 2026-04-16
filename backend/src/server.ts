/**
 * Main server entry point for the E-Clearance system
 * Sets up Express server with middleware, routes, and database connection
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { connectDB } from "./config/db";
import { startStaleInstitutionCleanupJob } from "./cron/deleteStaleInstitutions";
import { initTermScheduler } from "./cron/termScheduler";

// Import all data models to register them with Mongoose
import "./models/Quote"; // Inspirational quotes for login/register pages
import "./models/User"; // User accounts with roles and permissions
import "./models/Institution"; // Multi-tenant institution management
import "./models/Organization"; // Organization structure for clearance workflow
import "./models/OrganizationMember"; // Organization membership tracking
import "./models/ClearanceOffice"; // Approval entities within organizations
import "./models/ClearanceRequirement"; // Tasks/submission requirements
import "./models/ClearanceSubmission"; // Student uploads and status
import "./models/ClearanceReview"; // Formal decisions on submissions
import "./models/ClearanceRequest"; // Student clearance requests and status tracking
import "./models/AuditLog"; // System audit trail for security
import "./models/InstitutionRequest"; // Institution registration requests
import "./models/Announcement"; // System announcements and notices
import "./models/DeanAssignment"; // Dean's jurisdiction management
import "./models/StudentProfile"; // Student-specific metadata
import "./models/Poll"; // System polls for organizations
import "./models/Comment"; // Comments for stream items
import "./models/AccessRequest"; // Google sign-in access requests

// Import route handlers
import unifiedAuthRoutes from "./routes/unifiedAuthRoutes";
import adminRoutes from "./routes/adminRoutes";
import studentRoutes from "./routes/studentRoutes";
import signatoryRoutes from "./routes/signatoryRoutes";
import deanRoutes from "./routes/deanRoutes";
import clearanceRoutes from "./routes/clearanceRoutes";
import clearanceItemRoutes from "./routes/clearanceItemRoutes";
import quoteRoutes from "./routes/quoteRoutes";
import institutionRequestRoutes from "./routes/institutionRequestRoutes";
import superAdminRoutes from "./routes/superAdminRoutes";
import superAdminUserRoutes from "./routes/superAdminUserRoutes";
import superAdminAnalyticsRoutes from "./routes/superAdminAnalyticsRoutes";
import superAdminAuditRoutes from "./routes/superAdminAuditRoutes";
import announcementRoutes from "./routes/announcementRoutes";
import organizationRoutes from "./routes/organizationRoutes";
import pollRoutes from "./routes/pollRoutes";
import commentRoutes from "./routes/commentRoutes";
import publicRoutes from "./routes/publicRoutes";
import contactRoutes from "./routes/contactRoutes";


// Load environment variables
dotenv.config();

// Initialize database connection
connectDB();

const app = express();

// Configure middleware
app.use(cors()); // Enable cross-origin requests
app.use(express.json({ limit: '50mb' })); // Parse JSON request bodies with increased limit for images
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"))); // Serve uploaded files

// Register API routes
app.use("/api/auth", unifiedAuthRoutes); // New unified authentication
app.use("/api/admin", adminRoutes); // Organization and requirement management
app.use("/api/student", studentRoutes); // Profile and common student operations
app.use("/api/clearance-items", clearanceItemRoutes); // Modern requirement submissions
app.use("/api/clearance", clearanceRoutes); // Main clearance workflow tracking
app.use("/api/signatory", signatoryRoutes); // Officer review workflow
app.use("/api/dean", deanRoutes); // Dean jurisdictional approval
app.use("/api/institution-requests", institutionRequestRoutes); // Institution onboarding
app.use("/api/super-admin", superAdminRoutes); // Super Admin controls
app.use("/api/super-admin", superAdminUserRoutes);
app.use("/api/super-admin", superAdminAnalyticsRoutes);
app.use("/api/super-admin", superAdminAuditRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/polls", pollRoutes); // Organization Polls
app.use("/api/comments", commentRoutes); // Comments for posts
app.use("/api/contact", contactRoutes); // Contact form submissions
app.use("/api/public", publicRoutes); // Public system statistics
app.use("/api", quoteRoutes); // Public metadata (quotes)

// Global Error Handler
import errorHandler from "./middleware/errorHandler";
app.use(errorHandler);

// Start background tasks
startStaleInstitutionCleanupJob();
initTermScheduler();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(Number(PORT), "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
