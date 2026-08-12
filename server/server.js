require('dotenv').config();
const express    = require('express');
const nodemailer = require('nodemailer');
const cors       = require('cors');

const app  = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Transporter Config for Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,      // Your Gmail address
        pass: process.env.GMAIL_APP_PASS   // 16-character App Password
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'ORA Najd lead server is running' });
});

// Lead Submission Endpoint
app.post('/api/submit', (req, res) => {
    const { name, phone } = req.body;

    if (!name || !phone) {
        return res.status(400).json({
            success: false,
            message: 'All fields (name, phone) are required.'
        });
    }

    const mailOptions = {
        from: `"ORA Najd Lead Capture" <${process.env.GMAIL_USER}>`,
        to:   process.env.RECIPIENT_EMAIL || process.env.GMAIL_USER,
        subject: `🔥 New ORA Lead: ${name}`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #c9aa71;border-radius:8px;background:#fafafa;">
                <div style="text-align:center;border-bottom:2px solid #c9aa71;padding-bottom:15px;margin-bottom:20px;">
                    <h2 style="color:#07090e;margin:0;font-size:24px;letter-spacing:2px;">ORA NAJD — EGY-PROPERTIES</h2>
                    <p style="color:#777;margin:5px 0 0;font-size:12px;">New Property Lead Captured</p>
                </div>
                <h3 style="color:#c9aa71;margin-top:0;">Lead Details</h3>
                <table style="width:100%;border-collapse:collapse;margin-bottom:25px;">
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:#555;width:150px;">Full Name:</td>
                        <td style="padding:10px;border-bottom:1px solid #eee;color:#111;">${name}</td>
                    </tr>
                    <tr>
                        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:#555;">Phone / WhatsApp:</td>
                        <td style="padding:10px;border-bottom:1px solid #eee;color:#111;">
                            <a href="https://wa.me/${phone.replace(/[^0-9]/g, '')}" style="color:#25d366;font-weight:bold;text-decoration:none;">
                                ${phone} (Chat on WhatsApp)
                            </a>
                        </td>
                    </tr>
                </table>
                <div style="background:#f1ebd9;padding:15px;border-radius:4px;font-size:13px;color:#5c4d36;line-height:1.5;border-left:4px solid #c9aa71;">
                    <strong>Action Required:</strong> Please contact this lead immediately. Click the phone link above to chat on WhatsApp.
                </div>
                <div style="text-align:center;margin-top:30px;border-top:1px solid #eee;padding-top:15px;font-size:11px;color:#999;">
                    &copy; 2026 EGY-PROPERTIES — ORA Najd Landing Page
                </div>
            </div>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to send email. Check server credentials.',
                error: error.message
            });
        }
        console.log('Email sent: ' + info.response);
        return res.status(200).json({
            success: true,
            message: 'Lead sent to Gmail successfully!'
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`ORA Najd lead server running on port ${PORT}`);
});
