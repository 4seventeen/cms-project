const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const databaseService = require('./databaseService');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-fallback-refresh-secret-key';
const JWT_EXPIRES_IN = '15m'; // Short-lived access token
const REFRESH_EXPIRES_IN = '7d'; // Long-lived refresh token

// In-memory store for refresh tokens (in production, use Redis or similar)
const refreshTokenStore = new Map();

/**
 * Authentication service for PostgreSQL with Cookie-based JWT and Refresh Tokens
 * Replaces Supabase Auth
 */

// Generate token pair (access + refresh)
function generateTokenPair(user) {
  // Generate access token
  const accessToken = jwt.sign(
    { 
      sub: user.id,
      email: user.email,
      username: user.username,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Generate refresh token
  const refreshTokenId = crypto.randomBytes(32).toString('hex');
  const refreshToken = jwt.sign(
    {
      sub: user.id,
      tokenId: refreshTokenId,
      type: 'refresh'
    },
    REFRESH_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  );

  // Store refresh token in memory with expiration
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  refreshTokenStore.set(refreshTokenId, {
    userId: user.id,
    expiresAt,
    createdAt: new Date()
  });

  return { accessToken, refreshToken, refreshTokenId };
}

// Revoke refresh token
function revokeRefreshToken(tokenId) {
  refreshTokenStore.delete(tokenId);
}

// Validate refresh token
function validateRefreshToken(tokenId) {
  const tokenData = refreshTokenStore.get(tokenId);
  if (!tokenData) {
    return null;
  }

  if (tokenData.expiresAt < new Date()) {
    refreshTokenStore.delete(tokenId);
    return null;
  }

  return tokenData;
}

// Clean expired tokens (call periodically)
function cleanExpiredTokens() {
  const now = new Date();
  for (const [tokenId, tokenData] of refreshTokenStore.entries()) {
    if (tokenData.expiresAt < now) {
      refreshTokenStore.delete(tokenId);
    }
  }
}

// Set up periodic cleanup (every hour)
setInterval(cleanExpiredTokens, 60 * 60 * 1000);

// Create a new user (signup)
async function createUser(userData) {
  try {
    const { email, password, username, role } = userData;

    console.log('Creating user with email:', email);

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await databaseService.getUserByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user in database
    const newUser = await databaseService.createUser({
      email,
      password_hash,
      username: username || email.split('@')[0], // Use email prefix as default username
      role
    });

    // Generate token pair
    const { accessToken, refreshToken, refreshTokenId } = generateTokenPair(newUser);

    // Return user data (without password hash) and tokens
    const { password_hash: _, ...userWithoutPassword } = newUser;
    
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      refreshTokenId,
      session: {
        access_token: accessToken,
        user: userWithoutPassword
      }
    };
  } catch (error) {
    console.error('Error in createUser:', error);
    throw new Error(`Signup failed: ${error.message}`);
  }
}

// Sign in user
async function signIn(credentials) {
  try {
    const { email, password } = credentials;

    console.log('Signing in user with email:', email);

    // Validate input
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    // Get user from database (with password hash)
    const user = await databaseService.getUserByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await databaseService.updateUserLastLogin(user.id);

    // Generate token pair
    const { accessToken, refreshToken, refreshTokenId } = generateTokenPair(user);

    // Return user data (without password hash) and tokens
    const { password_hash: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
      refreshTokenId,
      session: {
        access_token: accessToken,
        user: userWithoutPassword
      }
    };
  } catch (error) {
    console.error('Error in signIn:', error);
    throw new Error(`Sign in failed: ${error.message}`);
  }
}

// Refresh access token
async function refreshAccessToken(refreshToken) {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Validate refresh token in store
    const tokenData = validateRefreshToken(decoded.tokenId);
    if (!tokenData || tokenData.userId !== decoded.sub) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get fresh user data
    const user = await databaseService.getUserById(decoded.sub);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new token pair
    const { accessToken, refreshToken: newRefreshToken, refreshTokenId: newRefreshTokenId } = generateTokenPair(user);

    // Revoke old refresh token
    revokeRefreshToken(decoded.tokenId);

    return {
      user,
      accessToken,
      refreshToken: newRefreshToken,
      refreshTokenId: newRefreshTokenId
    };
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid refresh token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Refresh token expired');
    }
    throw new Error(`Token refresh failed: ${error.message}`);
  }
}

// Sign out user
async function signOut(refreshTokenId) {
  try {
    if (refreshTokenId) {
      revokeRefreshToken(refreshTokenId);
    }
    return { success: true, message: 'Signed out successfully' };
  } catch (error) {
    console.error('Error in signOut:', error);
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

// Get user from token
async function getUserFromToken(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      throw new Error('Invalid token type');
    }
    
    // Get fresh user data from database
    const user = await databaseService.getUserById(decoded.sub);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error(`Token verification failed: ${error.message}`);
  }
}

// Verify token (for middleware)
async function verifyToken(token) {
  try {
    if (!token) {
      return null;
    }

    // Remove 'Bearer ' prefix if present (for backward compatibility)
    const cleanToken = token.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    
    if (decoded.type !== 'access') {
      return null;
    }
    
    // Get user data
    const user = await databaseService.getUserById(decoded.sub);
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username
    };
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

// Get current user profile with additional profile data
async function getCurrentUserProfile(userId) {
  try {
    const user = await databaseService.getUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const profile = await databaseService.getProfileByUserId(userId);
    
    return {
      ...user,
      profile
    };
  } catch (error) {
    throw new Error(`Error fetching user profile: ${error.message}`);
  }
}

// Update user profile
async function updateUserProfile(userId, profileData) {
  try {
    // Check if profile exists
    const existingProfile = await databaseService.getProfileByUserId(userId);
    
    if (existingProfile) {
      // Update existing profile
      const updatedProfile = await databaseService.updateProfile(userId, profileData);
      return updatedProfile;
    } else {
      // Create new profile
      const newProfile = await databaseService.createProfile({
        user_id: userId,
        ...profileData
      });
      return newProfile;
    }
  } catch (error) {
    throw new Error(`Error updating user profile: ${error.message}`);
  }
}

// Change password
async function changePassword(userId, currentPassword, newPassword) {
  try {
    // Get user with password hash
    const user = await databaseService.getUserByEmail(
      (await databaseService.getUserById(userId)).email
    );
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await databaseService.updateUserPassword(userId, newPasswordHash);
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    throw new Error(`Error changing password: ${error.message}`);
  }
}

// Forgot password - send reset email
async function forgotPassword(email) {
  try {
    // Check if user exists
    const user = await databaseService.getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Save reset token to database
    await databaseService.createPasswordResetToken(user.id, resetToken, expiresAt);

    // In a real application, you would send an email here
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset',
      text: `Click the following link to reset your password: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`
    });

    return {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    throw new Error(`Failed to process password reset request: ${error.message}`);
  }
}

// Reset password with token
async function resetPassword(token, newPassword) {
  try {
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Get and validate reset token
    const resetTokenData = await databaseService.getPasswordResetToken(token);
    if (!resetTokenData) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await databaseService.updateUserPassword(resetTokenData.user_id, newPasswordHash);

    // Mark token as used
    await databaseService.markPasswordResetTokenAsUsed(token);

    return {
      success: true,
      message: 'Password has been reset successfully'
    };
  } catch (error) {
    throw new Error(`Error resetting password: ${error.message}`);
  }
}

// Clean up expired password reset tokens (run this periodically)
async function cleanupExpiredPasswordResetTokens() {
  try {
    const deletedCount = await databaseService.deleteExpiredPasswordResetTokens();
    console.log(`Cleaned up ${deletedCount} expired password reset tokens`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired password reset tokens:', error);
    throw error;
  }
}

module.exports = {
  createUser,
  signIn,
  refreshAccessToken,
  signOut,
  getUserFromToken,
  verifyToken,
  getCurrentUserProfile,
  updateUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  cleanupExpiredPasswordResetTokens,
  generateTokenPair,
  revokeRefreshToken,
  validateRefreshToken
};
