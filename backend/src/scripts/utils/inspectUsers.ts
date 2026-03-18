import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/e-clearance";

const inspectUsers = async () => {
    try {
        await mongoose.connect(MONGO_URI, { dbName: "e-clearance" });
        console.log("Connected to MongoDB.");

        const users = await User.find({}).lean();
        console.log(`Found ${users.length} users:`);

        users.forEach(u => {
            const user = u as any;
            console.log(`- Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  InstitutionId: ${user.institutionId}`);
            console.log(`  IsAdmin: ${user.isAdmin}`);
            console.log("-------------------");
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error inspecting users:", error);
    }
};

inspectUsers();
