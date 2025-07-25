const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Apply auth middleware to all payment routes
router.use(authMiddleware);

// Generate payment reference for counter payment
router.post('/reference', paymentController.generatePaymentReference);

// Upload GCash receipt
router.post('/upload', paymentController.uploadReceipt);

// Get payment status for a case
router.get('/status/:caseId', paymentController.getPaymentStatus);

// Delete case with payments
router.delete('/cases/:caseId', paymentController.deleteCase);

module.exports = router; 