exports.default = function handler(req, res) {
  res.status(200).json({ 
    message: 'API route is working!',
    timestamp: new Date().toISOString()
  });
};

module.exports = exports.default;
