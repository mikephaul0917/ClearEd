import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User";
import Institution from "../../models/Institution";

dotenv.config();

const seedUsers = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        await mongoose.connect(mongoUri, { dbName: "e-clearance" });
        console.log("Connected to MongoDB");

        const institution = await Institution.findOne({ domain: "dummy.edu" });
        if (!institution) {
            throw new Error("Dummy institution not found. Please run npm run seed-institution first.");
        }

        const commonPassword = "Password123!";

        const usersToSeed = [
            {
                fullName: "Dummy Student",
                email: "student@dummy.edu",
                password: commonPassword,
                role: "student" as const,
                institutionId: institution._id,
                emailVerified: true,
                isActive: true,
                enabled: true
            },
            {
                fullName: "Dummy Officer",
                email: "officer@dummy.edu",
                password: commonPassword,
                role: "officer" as const,
                institutionId: institution._id,
                emailVerified: true,
                isActive: true,
                enabled: true
            },
            {
                fullName: "Dummy Dean",
                email: "dean@dummy.edu",
                password: commonPassword,
                role: "dean" as const,
                institutionId: institution._id,
                emailVerified: true,
                isActive: true,
                enabled: true
            },
            {
                fullName: "Dummy Admin",
                email: "admin@dummy.edu",
                password: commonPassword,
                role: "admin" as const,
                institutionId: institution._id,
                emailVerified: true,
                isActive: true,
                enabled: true
            }
        ];

        for (const userData of usersToSeed) {
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User with email ${userData.email} already exists.`);
                continue;
            }

            const createdUser = await User.create(userData);
            console.log(`✅ Created ${userData.role}: ${userData.email}`);
        }

        console.log("\nSummary of Credentials:");
        console.log("------------------------");
        usersToSeed.forEach(u => {
            console.log(`Role: ${u.role.padEnd(8)} | Email: ${u.email.padEnd(20)} | Password: ${u.password}`);
        });

        await mongoose.disconnect();
        console.log("\nDisconnected from MongoDB");

    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();
