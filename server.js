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

// Debug: Log what we're getting from env (without exposing full password)
console.log('🔍 Gmail Configuration Check:');
console.log(`   GMAIL_USER: ${gmailUser ? gmailUser.trim() : 'NOT SET'}`);
console.log(`   GMAIL_APP_PASSWORD: ${gmailPassword ? `${gmailPassword.trim().substring(0, 4)}...${gmailPassword.trim().substring(gmailPassword.trim().length - 4)} (${gmailPassword.trim().length} chars)` : 'NOT SET'}`);

// Create transporter for Gmail SMTP
let transporter = null;

if (gmailUser && gmailPassword) {
  // Remove any whitespace from the app password
  const cleanPassword = gmailPassword.trim().replace(/\s+/g, '');
  const cleanUser = gmailUser.trim();
  
  // Validate password length (should be 16 characters)
  if (cleanPassword.length !== 16) {
    console.error(`❌ Invalid App Password length: ${cleanPassword.length} characters (expected 16)`);
    console.error('   Please generate a new App Password from: https://myaccount.google.com/apppasswords');
  } else {
    console.log(`✅ App Password length is correct: ${cleanPassword.length} characters`);
  }
  
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: cleanUser,
      pass: cleanPassword,
    },
    // Add TLS options for better compatibility
    secure: true,
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify connection (async, won't block server startup)
  transporter.verify((error, success) => {
    if (error) {
      console.error('');
      console.error('❌ Gmail SMTP connection failed:', error.message);
      console.error('');
      console.error('🔍 Detailed Error Information:');
      console.error(`   Error Code: ${error.code || 'N/A'}`);
      console.error(`   Error Response: ${error.response || 'N/A'}`);
      console.error(`   Error Response Code: ${error.responseCode || 'N/A'}`);
      console.error('');
      console.error('💡 Troubleshooting Steps:');
      console.error('   1. Verify 2-Step Verification is enabled:');
      console.error('      → https://myaccount.google.com/security');
      console.error('');
      console.error('   2. Generate a NEW App Password:');
      console.error('      → https://myaccount.google.com/apppasswords');
      console.error('      → Select "Mail" and "Other (Custom name)"');
      console.error('      → Name it "VoteEase"');
      console.error('      → Copy the 16-character password (remove spaces)');
      console.error('');
      console.error('   3. Verify .env.local has correct values:');
      console.error(`      → GMAIL_USER=${cleanUser}`);
      console.error(`      → GMAIL_APP_PASSWORD=<16-char-password>`);
      console.error('');
      console.error('   4. Make sure you RESTARTED the backend server after updating .env.local');
      console.error('      → Stop the server (Ctrl+C)');
      console.error('      → Run: npm run server');
      console.error('');
      console.error('   5. Try using a different Google account if issue persists');
      console.error('');
      console.error('   📧 For now, OTPs will be logged to console for testing');
    } else {
      console.log('✅ Gmail SMTP server is ready to send emails');
      console.log(`📧 Sending emails from: ${cleanUser}`);
    }
  });
} else {
  console.warn('⚠️  Gmail credentials not found. Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local');
  if (!gmailUser) {
    console.warn('   ❌ GMAIL_USER is not set');
  }
  if (!gmailPassword) {
    console.warn('   ❌ GMAIL_APP_PASSWORD is not set');
  }
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend API is running',
    gmailConfigured: !!transporter,
    gmailUser: gmailUser ? gmailUser.trim() : null
  });
});

// Test Gmail connection endpoint
app.get('/api/test-gmail', async (req, res) => {
  if (!transporter) {
    return res.status(500).json({ 
      error: 'Gmail not configured',
      message: 'Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local'
    });
  }

  try {
    await transporter.verify();
    res.json({ 
      success: true, 
      message: 'Gmail SMTP connection is working',
      user: gmailUser?.trim()
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Gmail SMTP connection failed',
      message: error.message,
      code: error.code,
      details: 'Check server console for detailed error information'
    });
  }
});

// Send Email OTP
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

    // Send email using Gmail SMTP
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
        console.error('');
        console.error('❌ Gmail SMTP error details:');
        console.error(`   Message: ${emailError.message}`);
        console.error(`   Code: ${emailError.code || 'N/A'}`);
        console.error(`   Response: ${emailError.response || 'N/A'}`);
        console.error(`   Response Code: ${emailError.responseCode || 'N/A'}`);
        console.error('');
        
        // Check if it's an authentication error
        if (emailError.message && (emailError.message.includes('535') || emailError.code === 'EAUTH')) {
          console.error('🔐 GMAIL AUTHENTICATION ERROR DETECTED');
          console.error('');
          console.error('   This usually means one of these issues:');
          console.error('   1. App Password is incorrect (most common)');
          console.error('   2. 2-Step Verification is not enabled');
          console.error('   3. App Password was revoked or expired');
          console.error('   4. Wrong email address in GMAIL_USER');
          console.error('');
          console.error('   🔧 Step-by-step fix:');
          console.error('   1. Go to: https://myaccount.google.com/security');
          console.error('      → Verify "2-Step Verification" shows "On"');
          console.error('');
          console.error('   2. Go to: https://myaccount.google.com/apppasswords');
          console.error('      → Delete any old "VoteEase" app passwords');
          console.error('      → Click "Select app" → Choose "Mail"');
          console.error('      → Click "Select device" → Choose "Other (Custom name)"');
          console.error('      → Enter "VoteEase" as the name');
          console.error('      → Click "Generate"');
          console.error('      → Copy the 16-character password (example: abcd efgh ijkl mnop)');
          console.error('');
          console.error('   3. Update .env.local:');
          console.error(`      → GMAIL_USER=${gmailUser?.trim() || 'your-email@gmail.com'}`);
          console.error('      → GMAIL_APP_PASSWORD=your16characterpassword (NO SPACES)');
          console.error('');
          console.error('   4. IMPORTANT: Restart the backend server:');
          console.error('      → Stop server: Press Ctrl+C in the terminal');
          console.error('      → Start server: npm run server');
          console.error('');
          console.error('   5. Check the server console for connection status');
          console.error('');
        }
        
        // Fallback: Return OTP in response for development
        console.warn('⚠️  OTP code for testing (check console):', otp_code);
        return res.status(500).json({
          error: 'Failed to send email via Gmail',
          details: emailError.message,
          errorCode: emailError.code || 'UNKNOWN',
          otp_code: otp_code, // Include OTP for development
          message: 'Check browser console for OTP code. Fix Gmail authentication to enable email sending.',
        });
      }
    } else {
      // Gmail not configured - return OTP in response
      console.warn('⚠️  Gmail SMTP not configured. OTP code for testing:', otp_code);
      return res.status(500).json({
        error: 'Email service not configured',
        details: 'Please set up Gmail SMTP in .env.local',
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
  if (transporter) {
    console.log(`📧 Sending emails from: ${gmailUser}`);
  } else {
    console.log('⚠️  Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env.local file');
  }
  console.log(`📧 Email OTP endpoint: POST /api/send-otp-email`);
});

