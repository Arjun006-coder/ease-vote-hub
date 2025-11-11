import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPassword) {
      return res.status(500).json({ 
        error: 'Gmail not configured',
        message: 'Please set GMAIL_USER and GMAIL_APP_PASSWORD in Vercel environment variables'
      });
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
      return res.status(200).json({ 
        success: true, 
        message: 'Gmail SMTP connection is working',
        user: cleanUser
      });
    } catch (error) {
      return res.status(500).json({ 
        error: 'Gmail SMTP connection failed',
        message: error.message,
        code: error.code
      });
    }
  } catch (error) {
    console.error('Error in test-gmail API:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
}

