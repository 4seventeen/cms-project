const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const databaseService = require('./databaseService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Authentication service for PostgreSQL
 * Replaces Supabase Auth
 */

// Create a new user (signup)
async function createUser(userData) {
  try {
    const { email, password, username } = userData;

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
      username: username || email.split('@')[0] // Use email prefix as default username
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: newUser.id,
        email: newUser.email,
        username: newUser.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password hash) and token
    const { password_hash: _, ...userWithoutPassword } = newUser;
    
    return {
      user: userWithoutPassword,
      token,
      session: {
        access_token: token,
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

    // Generate JWT token
    const token = jwt.sign(
      { 
        sub: user.id,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Return user data (without password hash) and token
    const { password_hash: _, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token,
      session: {
        access_token: token,
        user: userWithoutPassword
      }
    };
  } catch (error) {
    console.error('Error in signIn:', error);
    throw new Error(`Sign in failed: ${error.message}`);
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

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    // Verify JWT token
    const decoded = jwt.verify(cleanToken, JWT_SECRET);
    
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
    // Get user with current password hash
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

    // Validate new password
    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    await databaseService.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newPasswordHash, userId]
    );

    return { success: true, message: 'Password updated successfully' };
  } catch (error) {
    throw new Error(`Error changing password: ${error.message}`);
  }
}

module.exports = {
  createUser,
  signIn,
  getUserFromToken,
  verifyToken,
  getCurrentUserProfile,
  updateUserProfile,
  changePassword
};
