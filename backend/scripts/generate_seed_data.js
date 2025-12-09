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

const studentsRaw = `1	H24422002	Abineshwari Muthukumar	B.Tech	CSBS	abineshwarisharmila@gmail.com	9442327660
2	H24421003	Adarshkumar Sathiyamoorthy Sonai 	B. Tech	CSBS	zainadarsh@gmail.com	7845936644
3	H24422004	Akshaya Raguraman 	B.Tech	CSBS	akshayaraguraman1@gmail.com	8680039538
4	H24421005	Bharath Sangaramoorthi 	B.Tech	CSBS	sbbharath492526@gmail.com	7418637262
5	H24421006	Bharathiraj Matheswaran	B.Tech	CSBS	bharathiraj1024@gmail.com	8668063517
6	H24421007	Chaitanya Bardia Dilipkumar	B.Tech	CSBS	chaitanyabardia@gmail.com	6382870943
7	H24421008	Deva Sathish Kumaran Sankararaj Rajaveni	B.Tech	CSBS	dsksr19@gmail.com	7373797828
8	H24422009	Dhivya Dharsini Senthil Kumar	B.Tech	CSBS	dhivyas1404@gmail.com	9787659700
9	H24422010	Gayathri Ganesan	B.Tech	CSBS	gayugganesan@gmail.com	9566605292
10	H24422011	Gayathri BalaPachayappan 	B.Tech	CSBS 	gayathribalaji2242@gmail.com	7449139553
11	H24421012	Gideon glady Kiruba raja kumar	B.Tech	CSBS	gideonglady2005@gmail.com	7540082764
12	H24421013	Gideon Samuel Manoharan 	B.Tech	CSBS	gideonsamuel.india@gmail.com	7010942147
13	H24421014	Gobinath Kannan	B.Tech	CSBS	gobinathkannan2@gmail.com	8754882673
14	H24422015	Gopika Arumugam 	B.Tech	CSBS	agopikaarumugam@gmail.com 	6382554021
15	H24421016	Hariharan Senthil	B.Tech	CSBS	harirashgokul@gmail.com	8015503896
16	H24422017	Harini Venkatesan	B. Tech	CSBS	hariniivenkatesan@gmail.com	9786757627
17	H24421018	Harrish ERamaKrishnan Murugan	B. Tech	CSBS	harrishem406@gmail.com	8124090274
18	H24422021	Kaaviyaa Ilangovan 	B.Tech 	CSBS	kaaviyaa.i@gmail.com 	8608508638
19	H24421022	Logeshwaran  Eswaran Valarmathi 	B.Tech	CSBS	logeshwaranev@gmail.com	9344208949
20	H24422023	Logitha Kalyanasundaram 	B.Tech	CSBS	logithakalayanasundaram@gmail.com	8148489412
21	H24422024	Madhubala Murugan 	B.Tech	CSBS	mmadhubala1812@gmail.com	7845401710
22	H24422025	Mahasriya Somalinga Kumaran	B.Tech	CSBS	skmahasriya@gmail.com	8122626238
23	H24422026	Manasha Senthilnathan 	B.Tech	CSBS	manashasenthilnathan30@gmail.com	8098660322
24	H24421027	Mathesh Sankaranarayanan	B.Tech	CSBS	matheshstce@gmail.com	6381590391
25	H24422028	Mayukha Thangapandi	B.Tech	CSBS	mayukha005@gmail.com	6382255483
26	H24422029	Mazwin Asra Asraf Ali	B.Tech	CSBS	mazwinasra2005@gmail.com	6383182175
27	H24421030	Mithles Ramiya Suresh Babu	B.Tech	CSBS	mithlessureshbabu@gmail.com	9080099326
28	H24422031	Monisa Raja	B.Tech	CSBS	monisa4606@gmail.com	7603875693
29	H24421032	Muthupalaniappaa Muthuraman Nagammai	B.Tech	CSBS	muthupalaniappaamn@gmail.com	9787526688
30	H24422033	Nanthitha Murugesan	B.Tech	CSBS	m.nanthitha1428@gmail.com	9944042559
31	H24422034	Navina Murali	B.Tech	CSBS	navina26812@gmail.com	8610908767
32	H24421036	Nithinsundar Kandhasamy Kalyanasundaram	B.Tech	CSBS	nithinsundarkkoffl@gmail.com	8124253769
33	H24421037	Nithish Sudhakar	B.Tech	CSBS	nithishsudhakar708@gmail.com	8940465546
34	H24422038	Pandiyammal Alagarsamy	B.Tech	CSBS	pandiyammal6a@gmail.com	6369381110
35	H24421039	Philip Samuel Manimaran	B.Tech	CSBS	philipsamuelmanimaran@gmail.com	9345467727
36	H24421040	Pradeep Varatharaj	B.Tech	CSBS	pradeepvartharaj@gmail.com	6369679825
37	H24422041	Priya Ramesh kumar	B. Tech 	CSBS 	priyarrameshkumar@gmail.com 	8608450083
38	H24422042	Priyadharshini Udhayakumar	B. Tech	CSBS	priyaudhayakumar08@gmail.com	9790729428
39	H24421043	Ragavarshan Kuppan Suresh Babu Mahalakshmi	B. Tech	CSBS	ragavarshan2006@gmail.com	9025186561
40	H24422044	Rahmath Haneeaa Jaffer Sadiq Babu	B. Tech	CSBS	rahmathhaneeaaj@gmail.com	9894719009
41	H24422045	Rajalakshmi Manivannan	B. Tech	CSBS	rajimanivannan005@gmail.com	7010691964
42	H24422046	Sahana Senthilkumar	B. Tech	CSBS	visaha06@gmail.com	9445742068
43	H24421048	Shafic Hussain Jahir Hussain 	B.Tech	CSBS	mail2shafic@gmail.com	6369130363
44	H24421049	Sharukrishna Jeyakumar	B. Tech	CSBS	sharukrishnaj721@gmail.com	9486642157
45	H24421050	Shiva Harish Paulraj Suresh babu	B.Tech	CSBS	shivasureshbabu@gmail.com	9486888954
46	H24421051	Shree Haran Mahalingam SenthilKumar	B.Tech	CSBS	shreeharan44@gmail.com	8825824170
47	H24421052	Siddharth Alagappan	B.Tech	CSBS	siddharthmekala22@gmail.com	6383795612
48	H24422053	Sowndharya Kathirvel	B.Tech	CSBS	connect.sowndharya@gmail.com	8610088708
49	H24422054	Sree Varshini Ambalam Rajasimman	B.Tech	CSBS	arsreevarshini@gmail.com	6382263199
50	H24422055	Srikanth Mariappan	B.Tech	CSBS	srikanthrrr104@gmail.com	9363465817
51	H24422056	Subha Rani Palanichamy	B.Tech	CSBS 	subharanitce@gmail.com	9150813833
52	H24422057	Sudhika Karunanithi 	B.Tech	CSBS	sudhikakarnan8@gmail.com	8122749820
53	H24421058	Surya Badhan Dhanasekar	B.Tech	CSBS	suryabd558@gmail.com	6380655361
54	H24422059	Sutha Pugalenthi	B.Tech	CSBS	suthapugalenthi@gmail.com	9092571796
55	H24421060	Tamilnilavan Kannadasan 	B.Tech 	CSBS	tamilnilavanofficial@gmail.com	8925775915
56	H24422061	Tharani Ramasubbu	B. Tech	CSBS	rtharani2023@gmail.com	9042428984
57	H24422062	Uma Sowmya Muthukumar	B.Tech	CSBS	umasowmyam@gmail.com	9445386298
58	H24422063	Vaishnavi Eswar	B Tech	CSBS	vaishnavieswar46@gmail.com	8300566292
59	H24422064	Varshini Sakthivel 	B.Tech	CSBS 	varshinisakthivel6605@gmail.com	6382158106
60	H24422065	Varshini Selvam	B.Tech	CSBS	varshiniselvammp3@gmail.com	8148805642
61	H24422066	Veeralakshmi Shanmugavel Karuppasamy Matthuran	B.Tech	CSBS	veeralakshmioffcl@gmail.com	9790567267
62	H24422067	Visaka Palanivel	B.Tech	CSBS	visakapalanivell@gmail.com	8825879093
63	H24422068	Visalakshi Subramaniam	B.Tech	CSBS	visalakshisubramaniam16@gmail.com	6380152512
64	H24422069	Yogapriya Balamurugan 	B.Tech 	CSBS	yogapriya3125@gmail.com	9363031175
65	H24422302	Harini Sivasankaran Arumugam	B.Tech	CSBS	saharini084@gmail.com	9042303871
66	H24421303	Mari Aruthran BalaMurali Chandran 	B.Tech	CSBS	cbmari079@gmail.com	8838623057
67	H24422304	Priyadharshini Ganesan	B. Tech	CSBS	gpriya0405@gmail.com	7871334198
68	H24421305	Sakthi Dharan Murugaiah	B.Tech	CSBS	sakthidharan1929@gmail.com	9944564011
69	H24421306	Yeshwanth Krishna Kura Sathyamoorthy 	B.Tech	CSBS	yeskrish435@gmail.com	7338809001`;

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
