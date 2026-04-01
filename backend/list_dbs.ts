import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "";

const listDatabases = async () => {
    try {
        console.log("Connecting...");
        const conn = await mongoose.connect(MONGO_URI);
        const admin = conn.connection.db?.admin();
        if (!admin) throw new Error("Could not access admin DB");

        const dbs = await admin.listDatabases();
        console.log("Available databases:");
        dbs.databases.forEach((db: any) => console.log(` - ${db.name}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error("Error:", err);
    }
};

listDatabases();
