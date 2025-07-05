const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const attachmentsDir = path.join(uploadsDir, 'case-attachments');

// Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(attachmentsDir)) {
  fs.mkdirSync(attachmentsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create case-specific directory
    const caseId = req.body.caseId || req.params.caseId || 'temp';
    const caseDir = path.join(attachmentsDir, caseId);
    
    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }
    
    cb(null, caseDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and UUID
    const timestamp = Date.now();
    const randomString = uuidv4().substring(0, 8);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    
    const filename = `${timestamp}_${randomString}_${name}${ext}`;
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files per upload
  }
});

// Helper functions for file operations
const fileOperations = {
  // Save file and return file info
  saveFile: async (file, caseId, userId) => {
    const fileInfo = {
      file_name: file.originalname,
      file_type: file.mimetype,
      file_size: file.size,
      storage_path: file.path,
      case_uuid: caseId,
      uploaded_by: userId
    };
    
    return fileInfo;
  },

  // Delete file from filesystem
  deleteFile: async (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  },

  // Get file stream for download
  getFileStream: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        return fs.createReadStream(filePath);
      }
      return null;
    } catch (error) {
      console.error('Error getting file stream:', error);
      return null;
    }
  },

  // Check if file exists
  fileExists: (filePath) => {
    return fs.existsSync(filePath);
  },

  // Get file stats
  getFileStats: (filePath) => {
    try {
      if (fs.existsSync(filePath)) {
        return fs.statSync(filePath);
      }
      return null;
    } catch (error) {
      console.error('Error getting file stats:', error);
      return null;
    }
  },

  // Create case directory
  createCaseDirectory: (caseId) => {
    const caseDir = path.join(attachmentsDir, caseId);
    if (!fs.existsSync(caseDir)) {
      fs.mkdirSync(caseDir, { recursive: true });
    }
    return caseDir;
  },

  // Remove case directory (when case is deleted)
  removeCaseDirectory: async (caseId) => {
    const caseDir = path.join(attachmentsDir, caseId);
    try {
      if (fs.existsSync(caseDir)) {
        fs.rmSync(caseDir, { recursive: true, force: true });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error removing case directory:', error);
      return false;
    }
  }
};

module.exports = {
  upload,
  fileOperations,
  uploadsDir,
  attachmentsDir
}; 