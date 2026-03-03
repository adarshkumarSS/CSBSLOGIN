const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"CSBS Digital" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Email send failed:', error);
        return false;
    }
};

const getLogoHtml = () => {
    // Ideally hosted, but using a placeholder or CID if needed. 
    // For now, linking to a placeholder or expecting client to have it.
    // Since this is email, we should use a public URL or base64. 
    // Valid public URL would be best. 
    return `<div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4F46E5; font-family: Arial, sans-serif;">CSBS Digital</h1>
    </div>`;
};

const templates = {
    verification: (code) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            ${getLogoHtml()}
            <h2 style="color: #333;">Password Reset Verification</h2>
            <p style="color: #666;">You requested to reset your password. Use the following code to verify your identity:</p>
            <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #111;">${code}</span>
            </div>
            <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
    `,
    meetingNotification: (tutorName, meetingDetails) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            ${getLogoHtml()}
            <h2 style="color: #333;">New Meeting Alert</h2>
            <p style="color: #666;"><strong>${tutorName}</strong> has started a new meeting.</p>
            <div style="background-color: #eef2ff; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4F46E5;">
                <p style="margin: 5px 0;"><strong>Subject/Type:</strong> ${meetingDetails.type}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p style="margin: 5px 0;"><strong>Details:</strong> ${meetingDetails.degree} ${meetingDetails.semester} - ${meetingDetails.section}</p>
            </div>
            <p style="color: #666;">Please log in to your dashboard to view details and submit your queries.</p>
        </div>
    `
};

module.exports = { sendEmail, templates };
