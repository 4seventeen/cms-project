const db = require('../../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Payment Controller - Handles payment processing for cases
 */

// Configure multer for receipt uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/receipts');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    
    cb(null, `${timestamp}_${randomString}${extension}`);
  }
});

// File filter for receipts
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Generate 8-digit hexadecimal reference code
const generateReferenceCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Check if user owns the case
const checkCaseOwnership = async (caseId, userId) => {
  const query = 'SELECT user_id FROM cases WHERE uuid_id = $1';
  const result = await db.query(query, [caseId]);
  
  if (result.rows.length === 0) {
    throw new Error('Case not found');
  }
  
  if (result.rows[0].user_id !== userId) {
    throw new Error('Access denied: You can only access your own cases');
  }
  
  return true;
};

// Generate payment reference for counter payment
const generatePaymentReference = async (req, res) => {
  try {
    const { caseId, method } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!caseId || !method) {
      return res.status(400).json({
        error: 'Case ID and payment method are required',
        success: false
      });
    }

    if (method !== 'counter') {
      return res.status(400).json({
        error: 'Invalid payment method for reference generation',
        success: false
      });
    }

    // Check case ownership
    await checkCaseOwnership(caseId, userId);

    // Check if payment reference already exists
    const existingQuery = 'SELECT reference_code FROM payments WHERE case_id = $1 AND method = $2';
    const existingResult = await db.query(existingQuery, [caseId, method]);

    if (existingResult.rows.length > 0) {
      return res.json({
        success: true,
        referenceCode: existingResult.rows[0].reference_code,
        message: 'Reference code already exists for this case'
      });
    }

    // Generate new reference code
    const referenceCode = generateReferenceCode();

    // Insert payment record
    const insertQuery = `
      INSERT INTO payments (case_id, method, reference_code, status)
      VALUES ($1, $2, $3, 'pending_verification')
      RETURNING *
    `;
    
    const insertResult = await db.query(insertQuery, [caseId, method, referenceCode]);

    res.json({
      success: true,
      referenceCode: referenceCode,
      payment: insertResult.rows[0],
      message: 'Payment reference generated successfully'
    });

  } catch (error) {
    console.error('Generate payment reference error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate payment reference',
      success: false
    });
  }
};

// Upload GCash receipt
const uploadReceipt = async (req, res) => {
  try {
    const { caseId, method } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!caseId || !method || !req.file) {
      return res.status(400).json({
        error: 'Case ID, payment method, and receipt file are required',
        success: false
      });
    }

    if (method !== 'gcash') {
      return res.status(400).json({
        error: 'Invalid payment method for receipt upload',
        success: false
      });
    }

    // Check case ownership
    await checkCaseOwnership(caseId, userId);

    // Check if payment already exists
    const existingQuery = 'SELECT id FROM payments WHERE case_id = $1 AND method = $2';
    const existingResult = await db.query(existingQuery, [caseId, method]);

    if (existingResult.rows.length > 0) {
      // Update existing payment record (handle missing updated_at column)
      let updateResult;
      try {
        const updateQuery = `
          UPDATE payments 
          SET receipt_filename = $1, status = 'pending_verification', updated_at = NOW()
          WHERE case_id = $2 AND method = $3
          RETURNING *
        `;
        updateResult = await db.query(updateQuery, [req.file.filename, caseId, method]);
      } catch (columnError) {
        if (columnError.code === '42703') {
          // If updated_at column doesn't exist, update without it
          const fallbackQuery = `
            UPDATE payments 
            SET receipt_filename = $1, status = 'pending_verification'
            WHERE case_id = $2 AND method = $3
            RETURNING *
          `;
          updateResult = await db.query(fallbackQuery, [req.file.filename, caseId, method]);
        } else {
          throw columnError;
        }
      }
      
      return res.json({
        success: true,
        payment: updateResult.rows[0],
        message: 'Receipt uploaded successfully. Payment is pending admin verification.'
      });
    } else {
      // Insert new payment record
      const insertQuery = `
        INSERT INTO payments (case_id, method, receipt_filename, status)
        VALUES ($1, $2, $3, 'pending_verification')
        RETURNING *
      `;
      
      const insertResult = await db.query(insertQuery, [caseId, method, req.file.filename]);
      
      res.json({
        success: true,
        payment: insertResult.rows[0],
        message: 'Receipt uploaded successfully. Payment is pending admin verification.'
      });
    }

  } catch (error) {
    console.error('Upload receipt error:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      const filePath = path.join(__dirname, '../../uploads/receipts', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({
      error: error.message || 'Failed to upload receipt',
      success: false
    });
  }
};

// Delete case (with cascade delete of payments)
const deleteCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    // Check case ownership
    await checkCaseOwnership(caseId, userId);

    // Get payment info before deletion for cleanup
    const paymentQuery = 'SELECT receipt_filename FROM payments WHERE case_id = $1';
    const paymentResult = await db.query(paymentQuery, [caseId]);

    // Delete case (payments will be cascade deleted)
    const deleteQuery = 'DELETE FROM cases WHERE uuid_id = $1 AND user_id = $2 RETURNING uuid_id';
    const deleteResult = await db.query(deleteQuery, [caseId, userId]);

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Case not found or access denied',
        success: false
      });
    }

    // Clean up receipt files
    paymentResult.rows.forEach(payment => {
      if (payment.receipt_filename) {
        const filePath = path.join(__dirname, '../../uploads/receipts', payment.receipt_filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    res.json({
      success: true,
      message: 'Case and associated payments deleted successfully',
      deletedCaseId: deleteResult.rows[0].uuid_id
    });

  } catch (error) {
    console.error('Delete case error:', error);
    res.status(500).json({
      error: error.message || 'Failed to delete case',
      success: false
    });
  }
};

// Get payment status for a case
const getPaymentStatus = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;

    // Check case ownership
    await checkCaseOwnership(caseId, userId);

    // Get payment information (handle missing updated_at column gracefully)
    let query;
    try {
      // Try to query with updated_at column
      query = `
        SELECT id, method, reference_code, receipt_filename, status, created_at, updated_at
        FROM payments 
        WHERE case_id = $1
        ORDER BY created_at DESC
      `;
      const result = await db.query(query, [caseId]);
      
      return res.json({
        success: true,
        payments: result.rows,
        hasPayment: result.rows.length > 0
      });
    } catch (columnError) {
      // If updated_at column doesn't exist, query without it
      if (columnError.code === '42703') {
        query = `
          SELECT id, method, reference_code, receipt_filename, status, created_at, created_at as updated_at
          FROM payments 
          WHERE case_id = $1
          ORDER BY created_at DESC
        `;
      } else {
        throw columnError;
      }
    }
    
    const result = await db.query(query, [caseId]);

    res.json({
      success: true,
      payments: result.rows,
      hasPayment: result.rows.length > 0
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({
      error: error.message || 'Failed to get payment status',
      success: false
    });
  }
};

module.exports = {
  generatePaymentReference,
  uploadReceipt: [upload.single('receipt'), uploadReceipt],
  deleteCase,
  getPaymentStatus
}; 