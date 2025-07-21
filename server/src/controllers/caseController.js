const databaseService = require('../services/databaseService');
const { fileOperations } = require('../../config/fileStorage');

// Get all cases for the authenticated user
const getAllCases = async (req, res) => {
  try {
    const cases = await databaseService.getCasesByUserId(req.user.id);
    res.json({ cases });
  } catch (err) {
    console.error('Exception in getAllCases:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get a specific case by ID (only if owned by user)
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const caseData = await databaseService.getCaseById(id, userId);

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    res.json({ case: caseData });
  } catch (err) {
    console.error('Exception in getCaseById:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Create a new case
const createCase = async (req, res) => {
  try {
    const {
      case_description,
      status: rawStatus,
      case_type,
      respondent_first_name,
      respondent_middle_name = null,
      respondent_last_name,
      respondent_suffix = null,
      respondent_sitio,
      respondent_house
    } = req.body;
    const userId = req.user.id;

    const statusEnum = ['pending', 'in progress', 'resolved', 'open', 'closed'];

    // Normalise and validate status
    let status = (rawStatus || 'pending').toLowerCase().replace('_', ' ');

    if (!statusEnum.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Set default case_type to 'uncategorized' for new cases
    const defaultCaseType = case_type || 'uncategorized';

    // Validate required fields
    if (!case_description || !respondent_first_name || !respondent_last_name || !respondent_sitio || !respondent_house) {
      return res.status(400).json({ 
        error: 'Missing required case or respondent fields' 
      });
    }

    try {
      // Create the case first
      const caseData = await databaseService.createCase({
        user_id: userId,
        case_description,
        status,
        case_type: defaultCaseType
      });

      // Create the respondent record
      const respondentData = await databaseService.createRespondent({
        case_uuid: caseData.uuid_id,
        first_name: respondent_first_name,
        middle_name: respondent_middle_name,
        last_name: respondent_last_name,
        suffix: respondent_suffix,
        sitio_purok_subd: respondent_sitio,
        house_no_street: respondent_house
      });

      // Fetch the complete case with respondent data
      const completeCase = await databaseService.getCaseById(caseData.uuid_id, userId);

      res.status(201).json({ 
        message: 'Case created successfully',
        case: completeCase
      });
    } catch (dbError) {
      console.error('Database error in createCase:', dbError);
      
      // If respondent creation fails, we should clean up the case
      // This is handled by the database foreign key constraint
      
      if (dbError.message.includes('respondent')) {
        return res.status(500).json({ error: 'Failed to create respondent' });
      }
      
      return res.status(500).json({ error: 'Failed to create case' });
    }
  } catch (err) {
    console.error('Exception in createCase:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update case description (only if owned by user)
const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { case_description, status: statusRaw } = req.body;
    const userId = req.user.id;

    const statusEnum = ['pending', 'in progress', 'resolved', 'open', 'closed'];

    // Normalise and validate status
    const statusUpdate = statusRaw ? statusRaw.toLowerCase().replace('_', ' ') : null;

    if (!case_description && !statusUpdate) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    if (statusUpdate && !statusEnum.includes(statusUpdate)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    // Check if the case exists and belongs to the user
    const existingCase = await databaseService.getCaseById(id, userId);
    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Update the case
    const updatePayload = {};
    if (case_description) updatePayload.case_description = case_description;
    if (statusUpdate) updatePayload.status = statusUpdate;

    const updatedCase = await databaseService.updateCase(id, userId, updatePayload);

    if (!updatedCase) {
      return res.status(500).json({ error: 'Failed to update case' });
    }

    // Get the complete updated case data
    const completeCase = await databaseService.getCaseById(id, userId);

    res.json({ 
      message: 'Case updated successfully',
      case: completeCase
    });
  } catch (err) {
    console.error('Exception in updateCase:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete case (only if owned by user)
const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if the case exists and belongs to the user
    const existingCase = await databaseService.getCaseById(id, userId);
    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Delete case files from filesystem
    try {
      await fileOperations.removeCaseDirectory(id);
    } catch (fileError) {
      console.warn('Warning: Failed to delete case files:', fileError.message);
      // Continue with database deletion even if file deletion fails
    }

    // Delete the case (this will cascade delete respondents and attachments)
    const deletedCase = await databaseService.deleteCase(id, userId);

    if (!deletedCase) {
      return res.status(500).json({ error: 'Failed to delete case' });
    }

    res.json({ 
      message: 'Case deleted successfully',
      caseId: id
    });
  } catch (err) {
    console.error('Exception in deleteCase:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Upload case attachments
const uploadAttachments = async (req, res) => {
  try {
    const { caseId } = req.params;
    const userId = req.user.id;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Check if the case exists and belongs to the user
    const existingCase = await databaseService.getCaseById(caseId, userId);
    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Process each uploaded file
    const attachments = [];
    for (const file of files) {
      try {
        const fileInfo = await fileOperations.saveFile(file, caseId, userId);
        const attachment = await databaseService.createAttachment(fileInfo);
        attachments.push(attachment);
      } catch (fileError) {
        console.error('Error processing file:', file.originalname, fileError);
        // Continue with other files even if one fails
      }
    }

    res.json({
      message: 'Files uploaded successfully',
      attachments,
      uploadedCount: attachments.length,
      totalFiles: files.length
    });
  } catch (err) {
    console.error('Exception in uploadAttachments:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Download case attachment
const downloadAttachment = async (req, res) => {
  try {
    const { caseId, attachmentId } = req.params;
    const userId = req.user.id;

    // Check if the case exists and belongs to the user
    const existingCase = await databaseService.getCaseById(caseId, userId);
    if (!existingCase) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Find the attachment in the case data
    const attachment = existingCase.attachments?.find(att => att.id === attachmentId);
    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check if file exists
    if (!fileOperations.fileExists(attachment.storage_path)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    // Get file stream
    const fileStream = fileOperations.getFileStream(attachment.storage_path);
    if (!fileStream) {
      return res.status(500).json({ error: 'Failed to read file' });
    }

    // Set response headers
    res.setHeader('Content-Disposition', `attachment; filename="${attachment.file_name}"`);
    res.setHeader('Content-Type', attachment.file_type || 'application/octet-stream');

    // Stream file to response
    fileStream.pipe(res);
  } catch (err) {
    console.error('Exception in downloadAttachment:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  getAllCases,
  getCaseById,
  createCase,
  updateCase,
  deleteCase,
  uploadAttachments,
  downloadAttachment
}; 