import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const fixIndexes = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;
        if (!mongoUri) {
            console.error("MONGO_URI not found in environment");
            process.exit(1);
        }

        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri, { dbName: "e-clearance" });
        console.log("Connected.");

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error("Database connection not established");
        }
        const collection = db.collection("departments");

        console.log("Checking indexes for 'departments'...");
        const indexes = await collection.indexes();
        console.log("Current indexes:", JSON.stringify(indexes, null, 2));

        const codeIndex = indexes.find(idx => idx.name === "code_1");
        if (codeIndex) {
            console.log("Dropping problematic index 'code_1'...");
            await collection.dropIndex("code_1");
            console.log("Dropped 'code_1'.");
        } else {
            console.log("'code_1' index not found.");
        }

        console.log("Index fix completed.");
        await mongoose.disconnect();
    } catch (error) {
        console.error("Error fixing indexes:", error);
        process.exit(1);
    }
};

fixIndexes();
