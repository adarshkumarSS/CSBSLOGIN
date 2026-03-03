const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testCCM() {
    try {
        console.log('--- Starting CCM Backend Verification ---');

        // 1. Login as Student
        console.log('\n1. Logging in as Student...');
        let studentToken;
        try {
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: 'zainadarsh@gmail.com', 
                password: 'student123',
                expectedRole: 'student'
            });
            studentToken = res.data.data.token;
            console.log('✅ Student Login Successful');
        } catch (e) {
            console.error('❌ Student Login Failed. Status:', e.response?.status);
            console.error('Data:', JSON.stringify(e.response?.data, null, 2));
            return;
        }

        const studentConfig = { headers: { Authorization: `Bearer ${studentToken}` } };

        // 2. Fetch Subjects (Options)
        console.log('\n2. Fetching Subjects (Options)...');
        let subjectName = 'Test Subject'; 
        let staffName = 'Test Staff';
        try {
            const res = await axios.get(`${API_URL}/options`, studentConfig);
            console.log(`✅ Fetched ${res.data.length} subjects`);
            if (res.data.length > 0) {
                subjectName = res.data[0].subjectName;
                staffName = res.data[0].assignedStaffName;
            } else {
                console.log('⚠️ No subjects found. Complaint creation might fail if subjects are validated stricly.');
            }
        } catch (e) {
            console.error('❌ Fetch Subjects Failed:', e.response?.data || e.message);
        }

        // 3. Create Complaint
        console.log('\n3. Creating Complaint...');
        let complaintId;
        try {
            const payload = {
                year: 'II', // Arbitrary year for now, hoping validation passes or matches seed
                subject: subjectName,
                staffName: staffName,
                type: 'Academic',
                description: 'Integration Test Complaint via Script'
            };
            
            const res = await axios.post(`${API_URL}/complaints`, payload, studentConfig);
            complaintId = res.data._id;
            console.log('✅ Complaint Created:', complaintId);
        } catch (e) {
            console.error('❌ Create Complaint Failed:', e.response?.data || e.message);
        }

        if (!complaintId) {
            console.log('Stopping test as complaint creation failed.');
            return;
        }

        // 4. Fetch Complaints (Student View)
        console.log('\n4. Fetching My Complaints...');
        try {
            const res = await axios.get(`${API_URL}/complaints`, studentConfig);
            const found = res.data.find(c => c._id === complaintId);
            if (found) console.log('✅ Created complaint found in list');
            else console.error('❌ Created complaint NOT found in list');
        } catch (e) {
             console.error('❌ Fetch Complaints Failed:', e.response?.data || e.message);
        }

        // 5. Login as Admin/HOD to view/act
        console.log('\n5. Logging in as HOD/Admin...');
        let adminToken;
        try {
            // Trying as faculty which is the typical role string in this system (roles are 'student' or 'faculty')
            // IS_HOD boolean or specific email usually distinguishes HOD.
            const res = await axios.post(`${API_URL}/auth/login`, {
                email: 'mkkdit@tce.edu',
                password: 'faculty123',
                expectedRole: 'faculty'
            });
            adminToken = res.data.data.token;
            console.log('✅ HOD Login Successful');
        } catch (e) {
             console.error('❌ HOD Login Failed:', e.response?.data || e.message);
             return;
        }

        const adminConfig = { headers: { Authorization: `Bearer ${adminToken}` } };

        // 6. Fetch All Complaints (Admin View)
        console.log('\n6. Fetching All Complaints (Admin)...');
        try {
            const res = await axios.get(`${API_URL}/complaints`, adminConfig);
            const found = res.data.find(c => c._id === complaintId);
            if (found) console.log('✅ Complaint visible to Admin');
            else console.error('❌ Complaint NOT visible to Admin');
        } catch (e) {
            console.error('❌ Admin Fetch Failed:', e.response?.data || e.message);
        }

        // 7. Update Status (Approve)
        console.log('\n7. Updating Status (Admin Approve)...');
        try {
            await axios.patch(`${API_URL}/complaints/${complaintId}`, {
                status: 'Approved',
                remarks: 'Approved via Test Script',
                remarkType: 'coordinator'
            }, adminConfig);
            console.log('✅ Complaint Approved');
        } catch (e) {
             console.error('❌ Update Status Failed:', e.response?.data || e.message);
        }

    } catch (error) {
        console.error('Global Error:', error);
    }
}

testCCM();
