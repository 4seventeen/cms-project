const express = require('express');
const router = express.Router();
const authController = require('../src/controllers/authController');
const { authMiddleware } = require('../src/middleware/authMiddleware');

// Public routes (no authentication required)
// POST: User signup
router.post('/signup', authController.signup);
// POST: User signin
router.post('/signin', authController.signin);

// Protected routes (authentication required)
// GET: Get current user (protected)
router.get('/user', authMiddleware, authController.getCurrentUser);
// PUT: Update user profile (protected)
router.put('/profile', authMiddleware, authController.updateProfile);
// POST: Change password (protected)
router.post('/change-password', authMiddleware, authController.changePassword);
// POST: User logout
router.post('/logout', authController.logout); // Can be called without auth
// POST: Refresh access token
router.post('/refresh-token', authController.refreshToken);

module.exports = router; 