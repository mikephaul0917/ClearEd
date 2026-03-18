import User from "../models/User";
import Institution from "../models/Institution";
import bcrypt from "bcrypt";
import mongoose from "mongoose";

/**
 * OnboardingService
 * Handles the logic for first-time user registration and institutional binding.
 */
export class OnboardingService {
    /**
     * Processes a first-time user entry based on their academic email.
     * 
     * @param email The institutional email address
     * @param password The initial password to secure the account
     * @returns The newly created User document
     */
    static async onboardUser(email: string, password: string) {
        const emailDomain = email.split("@")[1]?.toLowerCase();

        if (!emailDomain) {
            throw new Error("Invalid email format for institutional onboarding.");
        }

        // 1. Resolve & Validate Institution
        const institution = await Institution.findOne({ domain: emailDomain });
        if (!institution) {
            throw new Error("Your institution is not registered on the platform.");
        }

        if (institution.status !== "approved") {
            throw new Error(`Institution access is currently ${institution.status}.`);
        }

        // 2. Check Enrollment Rule
        if (!institution.settings?.allowStudentRegistration) {
            throw new Error("Self-enrollment is disabled. Please contact your campus admin.");
        }

        // 3. Security: Prevent binding an existing user to another institution
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new Error("Account already exists. Please use the standard login flow.");
        }

        // 4. Create & Permanent Binding
        const student = await User.create({
            email: email.toLowerCase(),
            password: password, // Pre-save hook handled in User.ts
            fullName: email.split("@")[0].replace(/\./g, " "), // Basic name derivation
            role: "student",
            institutionId: institution._id,
            status: "active",
            enabled: true
        });

        return student;
    }
}

export default OnboardingService;
