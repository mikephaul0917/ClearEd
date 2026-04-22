import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User";
import Institution from "../../models/Institution";

dotenv.config();

const seedMSEUF = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        // Connect to MongoDB
        await mongoose.connect(mongoUri, { dbName: "e-clearance" });
        console.log("Connected to MongoDB");

        // 1. Create or Update Institution
        const institutionData = {
            name: "Manuel S. Enverga University Foundation",
            domain: "mseuf.edu",
            address: "Lucena City",
            contactNumber: "+639189411885",
            email: "administration@mseuf.edu", // Fallback institutional email
            administratorName: "Alex Benjamin Rivera",
            administratorPosition: "IT",
            status: "approved" as const,
            settings: {
                allowStudentRegistration: true,
                requireEmailVerification: false,
                maxUsers: 5000
            },
            approvedAt: new Date()
        };

        let institution = await Institution.findOne({ domain: institutionData.domain });
        if (institution) {
            console.log(`Institution with domain ${institutionData.domain} already exists. Updating...`);
            Object.assign(institution, institutionData);
            await institution.save();
        } else {
            institution = await Institution.create(institutionData);
            console.log(`✅ Institution created: ${institutionData.name}`);
        }

        // 2. Create or Update Admin User
        const adminData = {
            fullName: "Alex Benjamin Rivera",
            email: "admin.rivera@mseuf.edu",
            password: "1234", // Will be hashed by pre-save middleware
            role: "admin" as const,
            institutionId: institution._id,
            emailVerified: true,
            isActive: true,
            enabled: true,
            status: "active" as const
        };

        const existingAdmin = await User.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log(`Admin user with email ${adminData.email} already exists. Updating password...`);
            existingAdmin.password = adminData.password;
            existingAdmin.institutionId = institution._id;
            existingAdmin.role = "admin";
            await existingAdmin.save();
        } else {
            await User.create(adminData);
            console.log(`✅ Admin user created: ${adminData.email}`);
        }

        console.log("\nSummary of Seeded Data:");
        console.log("------------------------");
        console.log(`Institution: ${institutionData.name}`);
        console.log(`Admin Name:  ${adminData.fullName}`);
        console.log(`Admin Email: ${adminData.email}`);
        console.log(`Password:    ${adminData.password}`);
        console.log(`Role:        ${adminData.role}`);

        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");

    } catch (error) {
        console.error("Error seeding MSEUF data:", error);
        process.exit(1);
    }
};

seedMSEUF();
