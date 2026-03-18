/**
 * System Super Admin account seeding script
 * Creates a system-level Super Admin account that bypasses public registration
 * This account is not institution-bound and has full system access
 * Run with: npm run seed-super-admin
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import User from "../../models/User";

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string, { dbName: "e-clearance" });
    console.log("Connected to MongoDB");

    // Check if Super Admin already exists
    const existingSuperAdmin = await User.findOne({ 
      role: "super_admin",
      email: "superadmin@eclearance.system" 
    });

    if (existingSuperAdmin) {
      console.log("Super Admin account already exists");
      await mongoose.disconnect();
      return;
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash("SuperAdmin@2025!", saltRounds);

    // Create system Super Admin account
    const superAdmin = await User.create({
      username: "superadmin",
      fullName: "System Super Administrator",
      email: "superadmin@eclearance.system",
      password: hashedPassword,
      role: "super_admin",
      institutionId: undefined, // Not bound to any institution
      enabled: true,
      isActive: true,
      emailVerified: true, // Auto-verified system account
      accessKey: Math.random().toString(36).substring(2, 10).toUpperCase()
    });

    console.log("✅ System Super Admin account created successfully:");
    console.log("   Email: superadmin@eclearance.system");
    console.log("   Username: superadmin");
    console.log("   Password: SuperAdmin@2025!");
    console.log("   Role: super_admin");
    console.log("   Access Key:", superAdmin.accessKey);
    console.log("\n⚠️  IMPORTANT: Change the default password after first login!");
    console.log("⚠️  This account has access to ALL system features and institutions.");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");

  } catch (error) {
    console.error("Error seeding Super Admin:", error);
    process.exit(1);
  }
};

// Execute the seeding function
seedSuperAdmin();
