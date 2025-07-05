const express = require('express');
const router = express.Router();
const caseController = require('../src/controllers/caseController');
const { authMiddleware } = require('../src/middleware/authMiddleware');
const { upload } = require('../config/fileStorage');

// All case routes require authentication
router.use(authMiddleware);

// Case CRUD operations
router.get('/cases', caseController.getAllCases);
router.get('/cases/:id', caseController.getCaseById);
router.post('/cases', caseController.createCase);
router.put('/cases/:id', caseController.updateCase);
router.delete('/cases/:id', caseController.deleteCase);

// File upload and download
router.post('/cases/:caseId/attachments', upload.array('files', 5), caseController.uploadAttachments);
router.get('/cases/:caseId/attachments/:attachmentId/download', caseController.downloadAttachment);

module.exports = router; 