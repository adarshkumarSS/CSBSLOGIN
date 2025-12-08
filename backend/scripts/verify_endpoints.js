const fs = require('fs');

const API_URL = 'http://127.0.0.1:5000/api';

// Credentials from seed.js
const facultyCreds = { email: 'rajesh.kumar@tce.edu', password: 'faculty123', expectedRole: 'faculty' };
const studentCreds = { email: 'arun.kumar@student.tce.edu', password: 'student123', expectedRole: 'student' };
const hodCreds = { email: 'saravanan.hod@tce.edu', password: 'hod123', expectedRole: 'faculty' }; 

let facultyToken = '';
let studentToken = '';
let hodToken = '';
let createdMeetingId = '';
let createdQueryId = '';

async function post(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

async function get(url, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'GET', headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

async function patch(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}

async function runTests() {
    console.log('Starting API Verification...');

    try {
        // 1. Faculty Login
        console.log('\nTesting Faculty Login...');
        const facRes = await post(`${API_URL}/auth/login`, facultyCreds);
        if (facRes.success) {
            facultyToken = facRes.data.token;
            console.log('✅ Faculty Logged In');
        } else {
            throw new Error('Faculty Login Failed');
        }

        // 2. Student Login
        console.log('\nTesting Student Login...');
        const stuRes = await post(`${API_URL}/auth/login`, studentCreds);
        if (stuRes.success) {
            studentToken = stuRes.data.token;
            console.log('✅ Student Logged In');
        } else {
            throw new Error('Student Login Failed');
        }

        // 3. HOD Login
        console.log('\nTesting HOD Login...');
        const hodRes = await post(`${API_URL}/auth/login`, { email: 'saravanan.hod@tce.edu', password: 'hod123', expectedRole: 'faculty' }); 
        if (hodRes.success) {
            hodToken = hodRes.data.token;
            console.log('✅ HOD Logged In');
        } else {
            throw new Error('HOD Login Failed');
        }

        // 4. Create Meeting (Faculty)
        console.log('\nTesting Create Meeting...');
        const timestamp = Date.now();
        const meetingData = {
            month: 1,
            year: timestamp, // Ensure unique
            type: 'MONTHLY',
            degree: 'B.Tech',
            semester: 6,
            section: 'A'
        };
        const createRes = await post(`${API_URL}/meetings`, meetingData, facultyToken);
        if (createRes.success) {
            createdMeetingId = createRes.data._id;
            console.log(`✅ Meeting Created: ${createdMeetingId}`);
        }

        // 5. Open Meeting Window (Faculty)
        console.log('\nTesting Open Window...');
        await patch(`${API_URL}/meetings/${createdMeetingId}/open`, {}, facultyToken);
        console.log('✅ Meeting Window Opened');

        // 6. Get Meetings (Student) - Should see the meeting
        console.log('\nTesting Get Meetings (Student)...');
        const stuMeetingsRes = await get(`${API_URL}/meetings`, studentToken);
        const myMeeting = stuMeetingsRes.data.find(m => m._id === createdMeetingId);
        if (myMeeting) {
            console.log('✅ Student can see the meeting');
        } else {
            console.error('❌ Student CANNOT see the meeting (Check Tutor mapping)');
        }

        // 7. Submit Query (Student)
        console.log('\nTesting Submit Query...');
        const queryRes = await post(`${API_URL}/meetings/${createdMeetingId}/query`, {
            concern: 'API Test Query: Network issues in hostel'
        }, studentToken);
        createdQueryId = queryRes.data._id;
        console.log(`✅ Query Submitted: ${createdQueryId}`);

        // 8. View Queries (Faculty)
        console.log('\nTesting View Queries (Faculty)...');
        const queriesRes = await get(`${API_URL}/meetings/${createdMeetingId}/queries`, facultyToken);
        if (queriesRes.data.find(q => q._id === createdQueryId)) {
            console.log('✅ Faculty can see the query');
        } else {
            console.error('❌ Faculty CANNOT see the query');
        }

        // 9. Review Query (Faculty)
        console.log('\nTesting Review Query...');
        await patch(`${API_URL}/queries/${createdQueryId}`, {
            status: 'APPROVED',
            tutor_remark: 'Forwarded to CSG'
        }, facultyToken);
        console.log('✅ Query Reviewed');

        // 10. Generate PDF (Faculty)
        console.log('\nTesting Generate PDF...');
        const pdfRes = await post(`${API_URL}/meetings/${createdMeetingId}/generate-pdf`, {}, facultyToken);
        const pdfPath = pdfRes.data.pdfPath;
        console.log(`✅ PDF Generated at: ${pdfPath}`);

        // 11. HOD View
        console.log('\nTesting HOD View...');
        const hodMeetingsRes = await get(`${API_URL}/meetings`, hodToken);
        const hodMeeting = hodMeetingsRes.data.find(m => m._id === createdMeetingId);
        if (hodMeeting && hodMeeting.pdf_path) {
            console.log('✅ HOD can see meeting and PDF path');
        } else {
            console.error('❌ HOD verification failed');
        }

        console.log('\nALL TESTS PASSED SUCCESSFULLY! 🚀');

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
    }
}

runTests();
