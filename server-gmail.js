import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Gmail SMTP Configuration
const gmailUser = process.env.GMAIL_USER;
const gmailPassword = process.env.GMAIL_APP_PASSWORD;

// Create transporter for Gmail SMTP
let transporter = null;

if (gmailUser && gmailPassword) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPassword,
    },
  });

  // Verify connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Gmail SMTP connection failed:', error);
    } else {
      console.log('✅ Gmail SMTP server is ready to send emails');
    }
  });
} else {
  console.warn('⚠️  Gmail credentials not found. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local');
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// Send Email OTP using Gmail SMTP
app.post('/api/send-otp-email', async (req, res) => {
  try {
    const { identifier, otp_code } = req.body;

    if (!identifier || !otp_code) {
      return res.status(400).json({ error: 'Email and OTP code are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // If Gmail SMTP is configured, use it
    if (transporter) {
      try {
        const mailOptions = {
          from: `VoteEase <${gmailUser}>`,
          to: identifier,
          subject: 'Your VoteEase Verification Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4F46E5;">VoteEase Verification Code</h2>
              <p>Your verification code is:</p>
              <div style="background-color: #F3F4F6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                <h1 style="color: #4F46E5; font-size: 32px; margin: 0; letter-spacing: 8px;">${otp_code}</h1>
              </div>
              <p>This code will expire in 10 minutes.</p>
              <p style="color: #6B7280; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully via Gmail:', info.messageId);
        return res.json({ success: true, message: 'OTP sent successfully', data: info });
      } catch (emailError) {
        console.error('❌ Gmail SMTP error:', emailError);
        // Fallback: Return OTP in response for development
        console.warn('⚠️  OTP code for testing:', otp_code);
        return res.status(500).json({
          error: 'Failed to send email via Gmail',
          details: emailError.message,
          otp_code: otp_code, // Include OTP for development
        });
      }
    } else {
      // Gmail not configured - return OTP in response
      console.warn('⚠️  Gmail SMTP not configured. OTP code for testing:', otp_code);
      return res.status(500).json({
        error: 'Email service not configured',
        details: 'Please set up Gmail SMTP or use Resend API',
        otp_code: otp_code, // Include OTP for development
      });
    }
  } catch (error) {
    console.error('Error sending email OTP:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📧 Gmail SMTP configured: ${transporter ? '✅' : '❌'}`);
  if (!gmailUser || !gmailPassword) {
    console.log('⚠️  Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local file');
    console.log('📖 See GMAIL_SMTP_SETUP.md for instructions');
  }
  console.log(`📧 Email OTP endpoint: POST /api/send-otp-email`);
});


