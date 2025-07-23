const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Apply auth and admin middleware to all admin routes
router.use(authMiddleware);
router.use(adminMiddleware);

// Admin Dashboard - Get all cases
router.get('/cases', adminController.getAllCases);

// Admin Case Management
router.get('/cases/:id', adminController.getCaseById);
router.put('/cases/:id', adminController.updateCase);
router.patch('/cases/:id/category', adminController.updateCaseCategory);
router.delete('/cases/:id', adminController.deleteCase);

// Admin User Management
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.get('/users/:id/cases', adminController.getUserCases);
router.put('/users/:id/profile', adminController.updateUserProfile);

// Admin Statistics (future expansion)
// router.get('/statistics', adminController.getSystemStatistics);

// Admin Settings (future expansion)
// router.get('/settings', adminController.getSystemSettings);
// router.put('/settings', adminController.updateSystemSettings);

module.exports = router; 