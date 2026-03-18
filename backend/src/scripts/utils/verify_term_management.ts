import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';

interface Term {
    _id: string;
    academicYear: string;
    semester: string;
    isActive: boolean;
}

interface LoginResponse {
    token: string;
}

interface CreateTermResponse {
    term: Term;
}

interface ListTerms {
    data?: Term[];
}


async function verify() {
    console.log('--- STARTING TERM MANAGEMENT VERIFICATION ---');
    try {
        // 1. Login as Admin
        console.log('1. Logging in as admin...');
        const loginRes = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
            email: 'admin@dummy.edu',
            password: 'Phaul123!'
        });

        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('   Login successful.');

        // 2. Clear existing test terms if any (manual or via API if we had a clear way, but we will just create a unique one)
        const testAY = `TEST-${Date.now()}`;
        const testSem = 'Verification Semester';

        // 3. Create a new term
        console.log(`2. Creating new term: ${testAY}...`);
        const createRes = await axios.post<CreateTermResponse>(`${API_URL}/admin/terms`, {
            academicYear: testAY,
            semester: testSem,
            isActive: false
        }, config);

        const termId = createRes.data.term._id;
        console.log(`   Term created with ID: ${termId}`);

        // 4. List terms
        console.log('3. Listing terms...');
        const listRes = await axios.get<ListTerms | Term[]>(`${API_URL}/admin/terms`, config);

        const terms = Array.isArray(listRes.data) ? listRes.data : (listRes.data.data || []);
        const found = terms.find((t: Term) => t._id === termId);

        if (!found) throw new Error('Created term not found in list!');
        console.log(`   Term found in list. Total terms: ${terms.length}`);

        // 5. Activate the term
        console.log(`4. Activating term: ${termId}...`);
        await axios.put(`${API_URL}/admin/terms/${termId}/activate`, {}, config);
        console.log('   Activation successful.');

        // 6. Verify activation and deactivation of others
        console.log('5. Verifying primary status...');
        const listRes2 = await axios.get<ListTerms | Term[]>(`${API_URL}/admin/terms`, config);
        const terms2 = Array.isArray(listRes2.data) ? listRes2.data : (listRes2.data.data || []);
        const activated = terms2.find((t: Term) => t._id === termId);
        if (!activated) throw new Error('Term should be in the list!');
        if (!activated.isActive) throw new Error('Term should be active!');

        const activeCount = terms2.filter((t: Term) => t.isActive).length;

        if (activeCount !== 1) throw new Error(`Expected exactly 1 active term, found ${activeCount}`);
        console.log('   Primary status verified. Only 1 term is active.');

        // 7. Delete the term
        console.log(`6. Deleting term: ${termId}...`);
        await axios.delete(`${API_URL}/admin/terms/${termId}`, config);
        console.log('   Deletion successful.');

        // 8. Final check
        console.log('7. Final check...');
        const listRes3 = await axios.get<ListTerms | Term[]>(`${API_URL}/admin/terms`, config);
        const terms3 = Array.isArray(listRes3.data) ? listRes3.data : (listRes3.data.data || []);
        const stillExists = terms3.find((t: Term) => t._id === termId);
        if (stillExists) throw new Error('Term still exists after deletion!');

        console.log('   Verification complete: Term successfully deleted.');

        console.log('--- VERIFICATION SUCCESSFUL ---');
    } catch (error: any) {
        console.error('--- VERIFICATION FAILED ---');
        console.error(error.response?.data || error.message);
        process.exit(1);
    }
}

verify();
