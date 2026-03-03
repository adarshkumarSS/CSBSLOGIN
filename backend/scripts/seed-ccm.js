const axios = require('axios');

const API_URL = 'http://127.0.0.1:5000/api';

async function seedCCM() {
    try {
        console.log('--- Seeding CCM Subjects ---');

        // Login as HOD/Faculty
        console.log('Logging in...');
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'mkkdit@tce.edu',
            password: 'faculty123',
            expectedRole: 'faculty'
        });
        const token = res.data.data.token;
        
        console.log('Seeding subjects...');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const seedRes = await axios.post(`${API_URL}/options/seed`, {}, config);
        console.log('✅ Seeding Response:', seedRes.data.length, 'subjects created');

    } catch (e) {
        console.error('❌ Seeding Failed. Status:', e.response?.status);
        console.error('Data:', JSON.stringify(e.response?.data, null, 2));
    }
}

seedCCM();
