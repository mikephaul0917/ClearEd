import mongoose from "mongoose";
import dotenv from "dotenv";
import Institution from "../../models/Institution";

dotenv.config();

const seedInstitution = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        await mongoose.connect(mongoUri, { dbName: "e-clearance" });
        console.log("Connected to MongoDB");

        const dummyInstitution = {
            name: "Dummy University",
            domain: "dummy.edu",
            address: "123 Dummy St, Dummy City",
            contactNumber: "09123456789",
            email: "administration@dummy.edu",
            administratorName: "Dummy Administrator",
            administratorPosition: "President",
            status: "approved" as const,
            settings: {
                allowStudentRegistration: true,
                requireEmailVerification: false,
                maxUsers: 1000
            },
            approvedAt: new Date()
        };

        const existingInstitution = await Institution.findOne({ domain: dummyInstitution.domain });

        if (existingInstitution) {
            console.log(`Institution with domain ${dummyInstitution.domain} already exists.`);
            await mongoose.disconnect();
            return;
        }

        const createdInstitution = await Institution.create(dummyInstitution);

        console.log("✅ Dummy Institution created successfully:");
        console.log("   Name:", createdInstitution.name);
        console.log("   Domain:", createdInstitution.domain);
        console.log("   Status:", createdInstitution.status);

        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");

    } catch (error) {
        console.error("Error seeding Institution:", error);
        process.exit(1);
    }
};

seedInstitution();
