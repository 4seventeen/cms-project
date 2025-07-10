const express = require('express');
const router = express.Router();
const authController = require('../src/controllers/authController');
const { authMiddleware } = require('../src/middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendEmailVerification);

// Protected routes (authentication required)
router.get('/user', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/logout', authController.logout); // Can be called without auth

module.exports = router; 