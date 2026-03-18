import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

async function reproduce() {
    try {
        console.log("Logging in as student...");
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'student@dummy.edu',
            password: 'Password123!'
        }) as any;

        const token = loginRes.data.token;
        console.log("Login successful. Token acquired.");

        console.log("Attempting to join organization with code 'JHA6J4'...");
        try {
            const joinRes = await axios.post(`${API_URL}/organizations/join`,
                { joinCode: 'JHA6J4' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log("Join result:", joinRes.data);
        } catch (error: any) {
            console.error("Join failed with status:", error.response?.status);
            console.error("Error message:", error.response?.data?.message);
        }

        console.log("Attempting to fetch organization members as a student...");
        try {
            // Using the actual organization ID found in DB
            const orgId = "69a3928fddb1602eca0c4920";
            const membersRes = await axios.get(`${API_URL}/organizations/${orgId}/members`,
                { headers: { Authorization: `Bearer ${token}` } }
            ) as any;
            console.log("Members fetched successfully:", membersRes.data.data.length, "members found.");
        } catch (error: any) {
            console.error("Fetch members failed with status:", error.response?.status);
            console.error("Error message:", error.response?.data?.message);
        }

    } catch (error: any) {
        console.error("Reproduction failed:", error.response?.data || error.message);
    }
}

reproduce();
