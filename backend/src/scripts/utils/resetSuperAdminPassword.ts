/**
 * Reset Super Admin password to ensure it works
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../../models/User";

dotenv.config();

const resetSuperAdminPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, { dbName: "e-clearance" });
    console.log("✅ Connected to MongoDB");

    // Find existing Super Admin
    const superAdmin = await User.findOne({ 
      email: "superadmin@eclearance.system" 
    });

    if (!superAdmin) {
      console.log("❌ Super Admin account not found");
      await mongoose.disconnect();
      return;
    }

    console.log("✅ Found Super Admin account:", superAdmin.email);

    // Update with fresh password hash
    const saltRounds = 12;
    const newPassword = "SuperAdmin@2025!";
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await User.updateOne(
      { email: "superadmin@eclearance.system" },
      { 
        password: hashedPassword,
        enabled: true,
        emailVerified: true
      }
    );

    console.log("✅ Super Admin password updated successfully");
    console.log("   New password hash:", hashedPassword);
    console.log("   You can now login with:");
    console.log("   Email: superadmin@eclearance.system");
    console.log("   Password: SuperAdmin@2025!");

    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

console.log("🔄 Resetting Super Admin password...");
resetSuperAdminPassword();
