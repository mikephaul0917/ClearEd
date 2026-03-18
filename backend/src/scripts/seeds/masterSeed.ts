/**
 * Master Database Seeding Script - Final String-Based Version
 * This script ensures all 18+ collections are physically created in MongoDB Atlas
 * using database names as strings to bypass TypeScript model-as-value errors.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

// Import models for seeding
import User from "../../models/User";
import Institution from "../../models/Institution";
import Term from "../../models/Term";
import Quote from "../../models/Quote";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/e-clearance";

const DUMMY_INSTITUTION_ID = "69a18e496917b308bf0fe8c8";
const ADMIN_USER_ID = "69a18f6b1c1e356383dc9f8f";

const COLLECTION_NAMES = [
    "users",
    "institutions",
    "terms",
    "quotes",
    "organizations",
    "organizationmembers",
    "clearancerequirements",
    "clearancerequests",
    "clearancesubmissions",
    "clearancereviews",
    "clearanceoffices",
    "announcements",
    "announcementacknowledgments",
    "auditlogs",
    "notifications",
    "studentprofiles",
    "deanassignments",
    "institutionrequests"
];

async function createAllCollections(db: mongoose.mongo.Db) {
    console.log("Initializing all 18+ collections in Atlas...");
    for (const name of COLLECTION_NAMES) {
        try {
            await db.createCollection(name);
            console.log(` ✅ Collection created: ${name}`);
        } catch (err: any) {
            if (err.codeName !== 'NamespaceExists') {
                console.warn(` ⚠️ Error creating ${name}:`, err.message);
            } else {
                console.log(` ℹ️  Collection already exists: ${name}`);
            }
        }
    }
}

const masterSeed = async () => {
    try {
        console.log("-------------------------------------------");
        console.log("🚀 STARTING DATABASE INITIALIZATION");
        console.log("-------------------------------------------");

        await mongoose.connect(MONGO_URI, { dbName: "e-clearance" });
        console.log("Connected to MongoDB.");

        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection not established");

        console.log("Wiping existing data for a fresh start...");
        await db.dropDatabase();
        console.log("Database dropped.");

        await createAllCollections(db);

        console.log("\nSeeding master institutional data...");
        const institution = await Institution.create({
            _id: new mongoose.Types.ObjectId(DUMMY_INSTITUTION_ID),
            name: "Dummy University",
            domain: "dummy.edu",
            address: "123 Academic Blvd, Dummy City",
            contactNumber: "+63 912 345 6789",
            email: "admin@dummy.edu",
            administratorName: "Dummy Administrator",
            administratorPosition: "System Admin",
            status: "approved",
            settings: { allowStudentRegistration: true, requireEmailVerification: false },
            approvedAt: new Date()
        });

        await User.create({
            username: "superadmin",
            fullName: "System Super Administrator",
            email: "superadmin@eclearance.system",
            password: "1234",
            role: "super_admin",
            enabled: true, isActive: true, emailVerified: true
        });

        await User.create({
            _id: new mongoose.Types.ObjectId(ADMIN_USER_ID),
            fullName: "Institutional Admin",
            email: "admin@dummy.edu",
            password: "Password123!",
            role: "admin",
            institutionId: institution._id,
            emailVerified: true, isActive: true, enabled: true, status: "active"
        });

        await User.create({
            fullName: "Dummy Dean",
            email: "dean@dummy.edu",
            password: "Password123!",
            role: "dean",
            institutionId: institution._id,
            emailVerified: true, isActive: true, enabled: true, status: "active"
        });

        await User.create({
            fullName: "Dummy Officer",
            email: "officer@dummy.edu",
            password: "Password123!",
            role: "officer",
            institutionId: institution._id,
            emailVerified: true, isActive: true, enabled: true, status: "active"
        });

        await User.create({
            fullName: "Dummy Student",
            email: "student@dummy.edu",
            password: "Password123!",
            role: "student",
            institutionId: institution._id,
            emailVerified: true, isActive: true, enabled: true, status: "active"
        });

        await Term.create({
            name: "1st Semester 2025-2026",
            academicYear: "2025-2026",
            semester: "1st Semester",
            institutionId: institution._id,
            isActive: true,
            startDate: new Date()
        });

        await Quote.create({ text: "Success is a journey.", author: "Anonymous", page: "both", isActive: true });

        console.log("\n-------------------------------------------");
        console.log("🎊 SYSTEM FULLY INITIALIZED");
        console.log("-------------------------------------------");
        console.log("All 18+ Collections are now physically visible in Atlas.");
        console.log("Admin: admin@dummy.edu / 1234");
        console.log("-------------------------------------------");

        await mongoose.disconnect();
    } catch (error) {
        console.error("❌ ERROR:", error);
        process.exit(1);
    }
};

masterSeed();
