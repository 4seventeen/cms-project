const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");
const authService = require("../services/authService");

// Signup endpoint
const signup = async (req, res) => {
  try {
    const { email, password, username } = req.body;

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

    // Create user
    const result = await authService.createUser({ email, password, username });

    res.status(201).json({
      message: 'User created successfully',
      user: result.user,
      token: result.token,
      session: result.session
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

    res.json({
      message: 'Sign in successful',
      user: result.user,
      token: result.token,
      session: result.session
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

// Update user profile endpoint
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Remove any fields that shouldn't be updated directly
    const { id, user_id, created_at, updated_at, ...allowedUpdates } = profileData;

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

// Logout endpoint (mainly for client-side token cleanup)
const logout = async (req, res) => {
  try {
    // With JWT, we can't actually invalidate the token server-side without a blacklist
    // This endpoint mainly exists for consistency and client-side cleanup
    res.json({
      message: 'Logout successful',
      success: true
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed'
    });
  }
};

module.exports = {
  signup,
  signin,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout
};
