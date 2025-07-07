const authService = require('../services/authService');

const authMiddleware = async (req, res, next) => {
  try {
    // Try to get token from cookies first, then fallback to Authorization header for backward compatibility
    let token = req.cookies.accessToken;
    
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
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
      // For cookie-based auth, try to refresh token automatically
      if (req.cookies.refreshToken) {
        try {
          const result = await authService.refreshAccessToken(req.cookies.refreshToken);
          
          // Set new cookies
          const COOKIE_OPTIONS = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
          };
          
          const REFRESH_COOKIE_OPTIONS = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
          };
          
          res.cookie('accessToken', result.accessToken, COOKIE_OPTIONS);
          res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);
          
          // Add user info to request object
          req.user = {
            id: result.user.id,
            email: result.user.email,
            username: result.user.username
          };
          
          return next();
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear cookies if refresh fails
          res.clearCookie('accessToken', { httpOnly: true, sameSite: 'lax' });
          res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
          
          return res.status(401).json({ 
            error: 'Token expired and refresh failed. Please sign in again.' 
          });
        }
      }
      
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
    // Try to get token from cookies first, then fallback to Authorization header
    let token = req.cookies.accessToken;
    
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    if (token) {
      try {
        const user = await authService.verifyToken(token);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // For optional auth, we continue even if token verification fails
        console.warn('Optional auth middleware warning:', error.message);
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
