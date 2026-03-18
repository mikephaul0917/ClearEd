import mongoose from "mongoose";
import dotenv from "dotenv";
import Organization from "../../models/Organization";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/e-clearance";

const inspectOrgs = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "e-clearance" });
        console.log("Connected to MongoDB.");

        const orgs = await Organization.find({}).lean();
        console.log(`Found ${orgs.length} organizations:`);

        orgs.forEach(org => {
            console.log(`- Name: ${org.name}`);
            console.log(`  JoinCode: '${org.joinCode}'`);
            console.log(`  Status: ${org.status}`);
            console.log(`  IsActive: ${org.isActive}`);
            console.log(`  InstitutionId: ${org.institutionId}`);
            console.log(`  TermId: ${org.termId}`);
            console.log("-------------------");
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error inspecting organizations:", error);
    }
};

inspectOrgs();
