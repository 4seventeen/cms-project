const express = require('express');
const router = express.Router();
const caseController = require('../src/controllers/caseController');
const { authMiddleware } = require('../src/middleware/authMiddleware');
const { upload } = require('../config/fileStorage');

// All case routes require authentication
router.use(authMiddleware);

// Case CRUD operations
// GET: Get all cases
router.get('/cases', caseController.getAllCases);
// GET: Get case by ID
router.get('/cases/:id', caseController.getCaseById);
// POST: Create a new case
router.post('/cases', caseController.createCase);
// PUT: Update a case by ID
router.put('/cases/:id', caseController.updateCase);
// DELETE: Delete a case by ID
router.delete('/cases/:id', caseController.deleteCase);

// File upload and download
// POST: Upload attachments to a case
router.post('/cases/:caseId/attachments', upload.array('files', 5), caseController.uploadAttachments);
// GET: Download a case attachment
router.get('/cases/:caseId/attachments/:attachmentId/download', caseController.downloadAttachment);

module.exports = router; 