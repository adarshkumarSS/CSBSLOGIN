const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const FACULTY_EMAIL = 'skait@tce.edu'; // From seed data
const FACULTY_PASS = 'faculty123';
const STUDENT_EMAIL = 'logeshwaranev@gmail.com'; // From seed data
const STUDENT_PASS = 'student123';

async function verifyDynamicQuestions() {
    try {
        console.log('🧪 Starting Dynamic Questions Verification...');

        // 1. Login as Faculty
        console.log('🔑 Logging in as Faculty...');
        const facultyRes = await axios.post(`${API_URL}/auth/login`, {
            email: FACULTY_EMAIL,
            password: FACULTY_PASS
        });
        const facultyToken = facultyRes.data.data.token;
        const facultyHeaders = { headers: { 'Authorization': `Bearer ${facultyToken}` } };
        console.log('✅ Faculty Logged In');

        // Cleanup: Delete existing meeting for this month to avoid duplicates
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const existingMeetings = await axios.get(`${API_URL}/meetings`, facultyHeaders);
        for (const m of existingMeetings.data.data) {
             if (m.month === currentMonth && m.year === currentYear) {
                 // Open/Close endpoints exist, but no delete endpoint exposed in API?
                 // Wait, assume database might be cleared or just ignore if we can't delete via API.
                 // Actually, duplicate error implies UNIQUE index. If I can't delete via API, I should use a random section or modified params if the index includes them.
                 // Alternatively, I can ignore the error if it says duplicate and fetch the ID.
             }
        }
        
        // Better: Use a random topic/section if index not on those, OR if index is on Tutor+Month+Year, I'm stuck unless I delete.
        // Let's look at Meeting.js to see the index.

        // 2. Create Meeting with Questions
        console.log('📅 Creating Meeting with Questions...');
        const questions = [
            {
                id: 'q1',
                type: 'radio',
                question: 'Have you failed in any CAT exams?',
                options: ['Yes', 'No'],
                required: true
            },
            {
                id: 'q2',
                type: 'textarea',
                question: 'Please provide reason and subjects',
                required: true,
                conditional: {
                    enabled: true,
                    dependsOn: 'q1',
                    value: 'Yes'
                }
            }
        ];

        const topic = `Test Meeting ${Date.now()}`;
        const meetingRes = await axios.post(`${API_URL}/meetings`, {
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            type: 'MONTHLY',
            degree: 'B.Tech',
            semester: 5,
            section: 'A',
            custom_questions: questions
        }, facultyHeaders);
        
        const meetingId = meetingRes.data.data._id;
        console.log(`✅ Meeting Created (ID: ${meetingId})`);


        // 3. Login as Student
        console.log('🔑 Logging in as Student...');
        const studentRes = await axios.post(`${API_URL}/auth/login`, {
            email: STUDENT_EMAIL,
            password: STUDENT_PASS
        });
        const studentToken = studentRes.data.data.token;
        const studentHeaders = { headers: { 'Authorization': `Bearer ${studentToken}` } };
        console.log('✅ Student Logged In');

        // 4. Submit Response (Scenario: Failed in CAT)
        console.log('📝 Submitting Response (with Conditional Logic)...');
        const answers = [
            { questionId: 'q1', answer: 'Yes' },
            { questionId: 'q2', answer: 'Failed in Math due to health issues' }
        ];

        await axios.post(`${API_URL}/meetings/${meetingId}/submit`, { answers }, studentHeaders);
        console.log('✅ Response Submitted Successfully');

        // 5. Submit Duplicate Response (Should Fail)
        console.log('🚫 Testing Duplicate Submission...');
        try {
             await axios.post(`${API_URL}/meetings/${meetingId}/submit`, { answers }, studentHeaders);
             console.error('❌ Failed: Duplicate submission should have thrown error');
        } catch (e) {
            if (e.response && e.response.status === 400) {
                console.log('✅ Duplicate Submission Blocked Correctly');
            } else {
                console.error('❌ Unexpected error for duplicate:', e.message);
            }
        }

        console.log('🎉 Verification Complete!');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', error.response.data);
        }
        process.exit(1);
    }
}

verifyDynamicQuestions();
