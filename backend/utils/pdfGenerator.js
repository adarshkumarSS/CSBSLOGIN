const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', 'public', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Helper to get base64 image
const getBase64Image = (filePath) => {
    try {
        const image = fs.readFileSync(filePath);
        return Buffer.from(image).toString('base64');
    } catch (e) {
        console.error("Failed to load logo", e);
        return "";
    }
};

const generateMeetingPDF = async ({ meeting, queries, responses, pendingStudents, totalStudents }) => {
    // Path resolution
    const logoFullPath = path.resolve(__dirname, '../../frontend/public/asset/logo.png');
    const logoBase64 = getBase64Image(logoFullPath);
    const logoSrc = logoBase64 ? `data:image/png;base64,${logoBase64}` : '';

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            @page {
                size: A4;
                margin: 0;
            }
            body { 
                font-family: 'Times New Roman', serif; 
                margin: 0;
                padding: 40px;
                box-sizing: border-box;
            }
            .page-border {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: 2px solid #000;
                box-sizing: border-box;
                z-index: -1;
                pointer-events: none;
                margin: 20px; /* inset border */
                width: calc(100% - 40px);
                height: calc(100% - 40px);
            }
            .header-container {
                position: relative;
                border-bottom: 2px solid #000;
                margin-bottom: 30px;
                padding: 10px 0 15px 0;
                min-height: 80px; /* Fixed height region */
            }
            .logo {
                width: 80px;
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%); /* Vertically center */
            }
            .header-content {
                text-align: center;
                width: 100%;
            }
            .college-name {
                font-size: 22px; 
                font-weight: bold;
                text-transform: uppercase;
                margin: 0 0 5px 0;
                color: #000;
            }
            .college-address {
                font-size: 14px;
                margin: 0;
            }
            .report-title {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                text-decoration: underline;
                margin: 20px 0;
            }
            .meta-table {
                width: 100%;
                margin-bottom: 20px;
                border: none;
            }
            .meta-table td {
                border: none;
                padding: 5px;
                font-weight: bold;
            }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
            th, td { border: 1px solid black; padding: 6px; text-align: left; font-size: 12px; vertical-align: top; }
            th { background-color: #f0f0f0; font-weight: bold; }
            
            .section-title {
                font-size: 14px;
                font-weight: bold;
                margin-top: 20px;
                margin-bottom: 10px;
                background-color: #eee;
                padding: 5px;
            }

            .signatures { margin-top: 60px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; }
            .footer {
                position: fixed;
                bottom: 30px;
                width: 100%;
                text-align: center;
                font-size: 10px;
            }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          <div class="page-border"></div>

          <div class="header-container">
            ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : ''}
            <div class="header-content">
                <h1 class="college-name">Thiagarajar College of Engineering</h1>
                <p class="college-address">Madurai - 625 015, Tamil Nadu, India</p>
            </div>
          </div>

          <h2 class="report-title">Tutor-Ward Meeting: ${meeting.type === 'MONTHLY' ? 'Monthly' : 'End Semester'} Report</h2>
          
          <table class="meta-table">
              <tr>
                <th style="width: 20%">Student Name</th>
                <th style="width: 15%">Roll No</th>
                <th style="width: 30%">Concern</th>
                <th style="width: 35%">Action Taken / Remark</th>
              </tr>
            </thead>
            <tbody>
              ${queries.length > 0 ? queries.map(q => `
                <tr>
                  <td>${q.student_id ? q.student_id.name : 'Unknown'}</td>
                  <td>${q.student_id ? q.student_id.roll_number : '-'}</td>
                  <td>${q.concern}</td>
                  <td>${q.status === 'APPROVED' ? q.tutor_remark || 'Approved' : 'Rejected: ' + (q.tutor_remark || '')}</td>
                </tr>
              `).join('') : '<tr><td colspan="4" style="text-align:center;">No queries submitted</td></tr>'}
            </tbody>
          </table>

          <div class="section-title">2. Student Responses to Meeting Questions</div>
          ${meeting.custom_questions && meeting.custom_questions.length > 0 ? `
              <table>
                <thead>
                    <tr>
                        <th>Student Name</th>
                        ${meeting.custom_questions.map(q => `<th>${q.question}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${responses.map(r => `
                        <tr>
                            <td>${r.student_id ? r.student_id.name : 'Unknown'}</td>
                            ${meeting.custom_questions.map(q => {
                                const ans = r.answers.find(a => a.questionId === q.id);
                                return `<td>${ans ? ans.answer : '-'}</td>`;
                            }).join('')}
                        </tr>
                    `).join('')}
                </tbody>
              </table>
          ` : '<p>No custom questions asked in this meeting.</p>'}

          <div class="signatures">
             <span>Tutor Signature</span>
             <span>HOD Signature</span>
          </div>

          <!-- PENDING STUDENTS PAGE -->
          ${pendingStudents.length > 0 ? `
              <div class="page-break"></div>
              <div class="page-border"></div>
              <div class="header-container">
                ${logoSrc ? `<img src="${logoSrc}" class="logo" />` : ''}
                <div class="header-content">
                    <h1 class="college-name">Thiagarajar College of Engineering</h1>
                    <p class="college-address">Madurai - 625 015, Tamil Nadu, India</p>
                </div>
              </div>
              
              <h2 class="report-title">Pending Submissions List</h2>
              
              <p>The following students have not submitted the meeting form as of ${new Date().toLocaleString()}:</p>

              <table>
                <thead>
                    <tr>
                        <th style="width: 10%">S.No</th>
                        <th style="width: 30%">Roll Number</th>
                        <th style="width: 40%">Student Name</th>
                        <th style="width: 20%">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${pendingStudents.map((s, idx) => `
                        <tr>
                            <td>${idx + 1}</td>
                            <td>${s.roll_number}</td>
                            <td>${s.name}</td>
                            <td style="color: red; font-weight: bold;">Pending</td>
                        </tr>
                    `).join('')}
                </tbody>
              </table>
          ` : ''}

        </body>
        </html>
    `;

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent);

    // Generate simpler filename/path
    const fileName = `Report_${meeting.degree}_${meeting.semester}${meeting.section}_${meeting.month}_${meeting.year}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    await page.pdf({ 
        path: filePath, 
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' } 
    });
    await browser.close();

    return {
        fileName,
        filePath,
        relativePath: `/reports/${fileName}`
    };
};

module.exports = { generateMeetingPDF };
