const authService = require('../services/authService');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    // Extract token from 'Bearer <token>' format
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token format.' 
      });
    }

    // Verify token and get user data
    const user = await authService.verifyToken(token);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid or expired token.' 
      });
    }
    
    // Add user info to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Token expired. Please sign in again.' 
      });
    }
    
    if (error.message.includes('invalid')) {
      return res.status(401).json({ 
        error: 'Invalid token. Please sign in again.' 
      });
    }
    
    res.status(401).json({ 
      error: 'Authentication failed.' 
    });
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
