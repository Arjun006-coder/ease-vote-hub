exports.default = function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const gmailUser = process.env.GMAIL_USER;
  const gmailPassword = process.env.GMAIL_APP_PASSWORD;

  res.status(200).json({ 
    status: 'ok', 
    message: 'Backend API is running',
    gmailConfigured: !!(gmailUser && gmailPassword),
    gmailUser: gmailUser ? gmailUser.trim() : null,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
};

module.exports = exports.default;
