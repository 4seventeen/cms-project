const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const authService = require("../services/authService");

// Cookie options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // HTTPS in production
  sameSite: 'lax',
  maxAge: 15 * 60 * 1000 // 15 minutes for access token
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
};

// Set authentication cookies
function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, COOKIE_OPTIONS);
  res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
}

// Clear authentication cookies
function clearAuthCookies(res) {
  res.clearCookie('accessToken', { httpOnly: true, sameSite: 'lax' });
  res.clearCookie('refreshToken', { httpOnly: true, sameSite: 'lax' });
}

// Signup endpoint
const signup = async (req, res) => {
  try {
    const { email, password, username, role = false} = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Create user and send verification email
    const result = await authService.createUser({ email, password, username, role });

    res.status(201).json({
      message: result.message,
      user: result.user,
      success: true
    });
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create user'
    });
  }
};

// Signin endpoint
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Authenticate user
    const result = await authService.signIn({ email, password });

    // Set authentication cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      message: 'Sign in successful',
      user: result.user,
      session: {
        user: result.user
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    
    if (error.message.includes('Invalid email or password')) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Authentication failed'
    });
  }
};

// Refresh token endpoint
const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    // Refresh access token
    const result = await authService.refreshAccessToken(refreshToken);

    // Set new authentication cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      message: 'Token refreshed successfully',
      user: result.user
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    
    // Clear cookies on refresh failure
    clearAuthCookies(res);
    
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Token refresh failed'
    });
  }
};

// Get current user endpoint
const getCurrentUser = async (req, res) => {
  try {
    // User info is already available from auth middleware
    const userId = req.user.id;
    
    // Get complete user profile
    const userProfile = await authService.getCurrentUserProfile(userId);
    
    res.json({
      success: true,
      user: userProfile
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch user data'
    });
  }
};

// Update user profile endpoint (restricted for regular users)
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Get user role to determine allowed updates
    const user = await authService.getUserFromToken(req.cookies.accessToken || req.header('Authorization')?.replace('Bearer ', ''));
    
    let allowedUpdates;
    
    if (user.role === true) {
      // Admin users can update all profile fields
      const { id, user_id, created_at, updated_at, ...allUpdates } = profileData;
      allowedUpdates = allUpdates;
    } else {
      // Regular users can only update phone number
      const { phone } = profileData;
      allowedUpdates = { phone };
      
      // Validate phone number for regular users
      if (phone && !/^[0-9]{11}$/.test(phone)) {
        return res.status(400).json({ 
          error: 'Phone number must be 11 digits'
        });
      }
    }

    const updatedProfile = await authService.updateUserProfile(userId, allowedUpdates);
    
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to update profile'
    });
  }
};

// Change password endpoint
const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Current password, new password, and confirmation are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'New password and confirmation do not match' 
      });
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);
    
    res.json({
      message: result.message,
      success: true
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.message.includes('Current password is incorrect')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to change password'
    });
  }
};

// Logout endpoint
const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    // Extract refresh token ID if available
    let refreshTokenId = null;
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'your-fallback-refresh-secret-key');
        refreshTokenId = decoded.tokenId;
      } catch (error) {
        // Token might be invalid, but we still want to clear cookies
        console.warn('Could not decode refresh token during logout:', error.message);
      }
    }

    // Revoke refresh token
    await authService.signOut(refreshTokenId);

    // Clear authentication cookies
    clearAuthCookies(res);

    res.json({
      message: 'Logout successful',
      success: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    // Still clear cookies even if there's an error
    clearAuthCookies(res);
    
    res.status(500).json({ 
      error: 'Logout failed'
    });
  }
};

// Forgot password endpoint
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    // Process forgot password request
    const result = await authService.forgotPassword(email);

    res.json({
      message: result.message,
      success: true
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process password reset request'
    });
  }
};

// Reset password endpoint
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Token, new password, and confirmation are required' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        error: 'New password and confirmation do not match' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Reset password
    const result = await authService.resetPassword(token, newPassword);

    res.json({
      message: result.message,
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    
    if (error.message.includes('Invalid or expired reset token')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to reset password'
    });
  }
};

// Verify email endpoint
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    // Validate input
    if (!token) {
      return res.status(400).json({ 
        error: 'Verification token is required' 
      });
    }

    // Verify email
    const result = await authService.verifyEmail(token);

    res.json({
      message: result.message,
      user: result.user,
      success: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    
    if (error.message.includes('Invalid or expired verification token')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to verify email'
    });
  }
};

// Resend email verification endpoint
const resendEmailVerification = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ 
        error: 'Email is required' 
      });
    }

    // Resend verification email
    const result = await authService.resendEmailVerification(email);

    res.json({
      message: result.message,
      success: true
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to resend verification email'
    });
  }
};

module.exports = {
  signup,
  signin,
  refreshToken,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendEmailVerification
};
