const fs = require('fs');
const path = require('path');

const facultyRaw = [
    { name: "Dr. M. K. Kavitha Devi", email: "mkkdit@tce.edu", designation: "HOD", employee_id: "HOD001", phone: "+91 9876500001" },
    { name: "Dr. S. Karthiga", email: "skait@tce.edu", designation: "Associate Professor", employee_id: "FAC002", phone: "+91 9876500002" },
    { name: "Dr. J. Felicia Lilian", email: "jflcse@tce.edu", designation: "Assistant Professor", employee_id: "FAC003", phone: "+91 9876500003" },
    { name: "Mr. V. Janakiraman", email: "vjncse@tce.edu", designation: "Assistant Professor", employee_id: "FAC004", phone: "+91 9876500004" },
    { name: "Dr. P. Suganthi", email: "psica@tce.edu", designation: "Assistant Professor", employee_id: "FAC005", phone: "+91 9876500005" },
    { name: "Ms. R. Subhashni", email: "rsica@tce.edu", designation: "Assistant Professor", employee_id: "FAC006", phone: "+91 9876500006" },
    { name: "Ms. Priya Thiagarajan", email: "ptca@tce.edu", designation: "Assistant Professor", employee_id: "FAC007", phone: "+91 9876500007" },
    { name: "Mr. T. Siva", email: "tsca@tce.edu", designation: "Assistant Professor", employee_id: "FAC008", phone: "+91 9876500008" },
    { name: "Mr. M. Venkatesh", email: "mvhca@tce.edu", designation: "Assistant Professor", employee_id: "FAC009", phone: "+91 9876500009" },
    { name: "Mr. M. Gowtham Sethupathi", email: "mgsca@tce.edu", designation: "Assistant Professor", employee_id: "FAC010", phone: "+91 9876500010" },
    { name: "Mrs. D. Yuvasini", email: "dyica@tce.edu", designation: "Assistant Professor", employee_id: "FAC011", phone: "+91 9876500011" },
    { name: "Mrs. S. Sugantha", email: "ssaca@tce.edu", designation: "Assistant Professor", employee_id: "FAC012", phone: "+91 9876500012" }
];

const faculty = facultyRaw.map(f => ({
    ...f,
    department: 'Computer Science and Business Systems',
    password: 'faculty123'
}));

const studentsRaw = `
2	H24421003	Adarshkumar Sathiyamoorthy Sonai 	B. Tech	CSBS	zainadarsh@gmail.com	7845936644`;
// Parsing Logic
const parseStudents = (raw) => {
    const lines = raw.split('\n');
    return lines.map(line => {
        const parts = line.split(/\t+/); // Split by one or more tabs
        // Expected parts: [S.No, RegNo, Name, Degree, Branch, Email, Mobile]
        // Sometimes Mobile might be missing or contain spaces, trim everything
        if (parts.length < 7) {
             console.log("Skipping invalid line:", line);
             return null;
        }

        const roll_number = parts[1].trim();
        const name = parts[2].trim();
        const email = parts[5].trim();
        const phone = '+91 ' + parts[6].trim();

        return {
            name,
            email,
            password: 'student123',
            roll_number,
            batch: 2023, // 3rd Year
            department: 'Computer Science and Business Systems',
            degree: 'B.Tech',
            section: 'A',
            phone
        };
    }).filter(s => s !== null);
};

const students = parseStudents(studentsRaw);

// Write to files
fs.writeFileSync(path.join(__dirname, 'data', 'faculty.json'), JSON.stringify(faculty, null, 2));
fs.writeFileSync(path.join(__dirname, 'data', 'students.json'), JSON.stringify(students, null, 2));

console.log(`Generated ${faculty.length} faculty and ${students.length} students.`);
