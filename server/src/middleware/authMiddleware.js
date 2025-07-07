const authService = require('../services/authService');
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.accessToken;
  if (!token) {
    return res.status(401).json({ error: 'No access token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.sub, email: decoded.email, username: decoded.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
};

// Optional middleware for routes that can work with or without authentication
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      if (token) {
        const user = await authService.verifyToken(token);
        if (user) {
          req.user = user;
        }
      }
    }
    
    // Always continue, whether authenticated or not
    next();
  } catch (error) {
    // For optional auth, we continue even if token verification fails
    console.warn('Optional auth middleware warning:', error.message);
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware
};
