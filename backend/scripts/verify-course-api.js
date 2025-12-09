const axios = require('axios');

async function verifyCourseAPI() {
    const baseURL = 'http://localhost:5000/api';
    
    // 1. Login as Faculty
    console.log('🔑 Logging in...');
    try {
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'rajesh.kumar@tce.edu',
            password: 'faculty123',
            role: 'faculty'
        });
        
        console.log('✅ Login successful. Response Data:', loginRes.data);
        const token = loginRes.data.data.token;
        
        const config = {
            headers: { 'Authorization': `Bearer ${token}` }
        };

        // 2. Add Course
        console.log('\n➕ Adding a course...');
        const courseData = {
            subject_name: 'Test Subject',
            subject_code: 'TEST101',
            degree: 'B.Tech',
            department: 'CSBS',
            year: 'II',
            semester: 3,
            section: 'A',
            academic_year: '2025-2026'
        };
        
        const addRes = await axios.post(`${baseURL}/courses`, courseData, config);
        console.log('✅ Course added:', addRes.data.data.subject_name);
        const courseId = addRes.data.data._id;

        // 3. Get API Courses
        console.log('\n📋 Fetching my courses...');
        const getRes = await axios.get(`${baseURL}/courses/my-courses`, config);
        const courses = getRes.data.data;
        console.log(`✅ Fetched ${courses.length} courses.`);
        
        const addedCourse = courses.find(c => c._id === courseId);
        if (addedCourse) {
            console.log('✅ Verified: Added course is present in list.');
        } else {
            console.error('❌ Failed: Added course NOT found in list.');
        }

        // 4. Delete Course
        console.log(`\n🗑️ Deleting course ${courseId}...`);
        await axios.delete(`${baseURL}/courses/${courseId}`, config);
        console.log('✅ Course deleted.');

        // Verify Deletion
        const finalRes = await axios.get(`${baseURL}/courses/my-courses`, config);
        const remaining = finalRes.data.data;
        if (remaining.find(c => c._id === courseId)) {
            console.error('❌ Failed: Course still exists after delete.');
        } else {
            console.log('✅ Verified: Course removed from list.');
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ Error Data:', JSON.stringify(error.response.data, null, 2));
            console.error('❌ Error Status:', error.response.status);
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

verifyCourseAPI();
