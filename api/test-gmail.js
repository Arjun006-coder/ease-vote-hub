const nodemailer = require('nodemailer');

exports.default = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      res.status(500).json({ 
        error: 'Gmail not configured',
        message: 'Please set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel environment variables'
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

    // Verify connection
    try {
      await transporter.verify();
      res.status(200).json({ 
        success: true, 
        message: 'Gmail SMTP connection is working',
        user: cleanUser
      });
      return;
    } catch (error) {
      res.status(500).json({ 
        error: 'Gmail SMTP connection failed',
        message: error.message,
        code: error.code
      });
      return;
    }
  } catch (error) {
    console.error('Error in test-gmail API:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
    return;
  }
};

module.exports = exports.default;
