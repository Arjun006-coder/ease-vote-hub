const nodemailer = require('nodemailer');

exports.default = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { identifier, otp_code } = req.body;

    if (!identifier || !otp_code) {
      res.status(400).json({ error: 'Email and OTP code are required' });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Get Gmail credentials from environment variables
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      console.error('Gmail credentials not configured');
      // Return OTP in response for development/testing
      res.status(500).json({
        error: 'Email service not configured',
        details: 'Please set up Gmail SMTP in Vercel environment variables',
        otp_code: otp_code, // Include OTP for development
      });
      return;
    }

    // Clean credentials
    const cleanPassword = gmailPassword.trim().replace(/\s+/g, '');
    const cleanUser = gmailUser.trim();

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: cleanUser,
        pass: cleanPassword,
      },
      secure: true,
      tls: {
        rejectUnauthorized: false
      }
    });

    // Send email
    try {
      const mailOptions = {
        from: `VoteEase <${cleanUser}>`,
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
      console.log('✅ Email sent successfully:', info.messageId);
      
      res.status(200).json({ 
        success: true, 
        message: 'OTP sent successfully',
        messageId: info.messageId
      });
      return;
    } catch (emailError) {
      console.error('❌ Gmail SMTP error:', emailError.message);
      
      // Return OTP in response if email fails (for development/testing)
      res.status(500).json({
        error: 'Failed to send email via Gmail',
        details: emailError.message,
        errorCode: emailError.code || 'UNKNOWN',
        otp_code: otp_code, // Include OTP for development
        message: 'Check browser console for OTP code. Fix Gmail authentication to enable email sending.',
      });
      return;
    }
  } catch (error) {
    console.error('Error in send-otp-email API:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
    return;
  }
};

module.exports = exports.default;
