const db = require('../../config/database');

/**
 * Admin Controller - Handles all admin-specific operations
 * All methods require admin authentication (handled by middleware)
 */

// Get all cases in the system
const getAllCases = async (req, res) => {
  try {
      const query = `
    SELECT 
      c.uuid_id as id,
      c.*,
      u.email as complainant_email,
      p.first_name as complainant_first_name,
      p.last_name as complainant_last_name,
      c.case_description as case_title,
      COALESCE(
        CONCAT_WS(' ', 
          r.first_name, 
          NULLIF(r.middle_name, ''), 
          r.last_name, 
          NULLIF(r.suffix, '')
        ), 
        'No respondent listed'
      ) as respondent_name,
      c.case_type as case_category
    FROM cases c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN respondents r ON c.uuid_id = r.case_uuid
    ORDER BY c.created_at DESC
  `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      cases: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Admin get all cases error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cases',
      success: false 
    });
  }
};

// Get a specific case by ID
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
      const query = `
    SELECT 
      c.uuid_id as id,
      c.*,
      u.email as complainant_email,
      p.first_name as complainant_first_name,
      p.middle_name as complainant_middle_name,
      p.last_name as complainant_last_name,
      p.suffix as complainant_suffix,
      p.phone as complainant_phone,
      p.date_of_birth as complainant_date_of_birth,
      p.sex as complainant_sex,
      p.house_street as complainant_house_street,
      p.sitio_purok_subdivision as complainant_sitio_purok_subdivision,
      p.barangay as complainant_barangay,
      p.city as complainant_city,
      p.province as complainant_province,
      p.country as complainant_country,
      c.case_description as case_title,
      COALESCE(
        CONCAT_WS(' ', 
          r.first_name, 
          NULLIF(r.middle_name, ''), 
          r.last_name, 
          NULLIF(r.suffix, '')
        ), 
        'No respondent listed'
      ) as respondent_name,
      r.first_name as respondent_first_name,
      r.middle_name as respondent_middle_name,
      r.last_name as respondent_last_name,
      r.suffix as respondent_suffix,
      r.sitio_purok_subd as respondent_sitio_purok_subd,
      r.house_no_street as respondent_house_no_street,
      c.case_type as case_category
    FROM cases c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN respondents r ON c.uuid_id = r.case_uuid
    WHERE c.uuid_id = $1
  `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Case not found',
        success: false 
      });
    }

    // Get attachments for this case
    const attachmentsQuery = `
      SELECT 
        uuid_id as id,
        file_name,
        file_type,
        file_size,
        storage_path,
        created_at
      FROM case_attachments 
      WHERE case_uuid = $1
      ORDER BY created_at DESC
    `;
    
    const attachmentsResult = await db.query(attachmentsQuery, [id]);
    
    // Add attachments and respondents array to match expected format
    const caseData = result.rows[0];
    caseData.attachments = attachmentsResult.rows;
    
    // Create respondents array from the respondent data
    if (caseData.respondent_first_name) {
      caseData.respondents = [{
        first_name: caseData.respondent_first_name,
        middle_name: caseData.respondent_middle_name,
        last_name: caseData.respondent_last_name,
        suffix: caseData.respondent_suffix,
        sitio_purok_subd: caseData.respondent_sitio_purok_subd,
        house_no_street: caseData.respondent_house_no_street
      }];
    } else {
      caseData.respondents = [];
    }
    
    res.json({
      success: true,
      case: caseData
    });
  } catch (error) {
    console.error('Admin get case by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case',
      success: false 
    });
  }
};

// Delete a case (admin only)
const deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if case exists
    const checkQuery = 'SELECT uuid_id FROM cases WHERE uuid_id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Case not found',
        success: false 
      });
    }
    
    // Delete the case
    const deleteQuery = 'DELETE FROM cases WHERE uuid_id = $1 RETURNING uuid_id';
    const deleteResult = await db.query(deleteQuery, [id]);
    
    res.json({
      success: true,
      message: 'Case deleted successfully',
      deletedCaseId: deleteResult.rows[0].uuid_id
    });
  } catch (error) {
    console.error('Admin delete case error:', error);
    res.status(500).json({ 
      error: 'Failed to delete case',
      success: false 
    });
  }
};

// Update a case (admin only) - allows status changes and description updates
const updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { case_description, status, case_type } = req.body;
    
    // Valid status options
    const validStatuses = ['open', 'in progress', 'resolved', 'closed', 'pending', 'terminated'];
    
    // Check if case exists
    const checkQuery = 'SELECT uuid_id FROM cases WHERE uuid_id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Case not found',
        success: false 
      });
    }

    // Validate status if provided
    if (status && !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ 
        error: `Invalid status. Valid options: ${validStatuses.join(', ')}`,
        success: false 
      });
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    if (case_description) {
      updateFields.push(`case_description = $${paramIndex}`);
      values.push(case_description);
      paramIndex++;
    }

    if (status) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(status.toLowerCase());
      paramIndex++;
    }

    if (case_type) {
      updateFields.push(`case_type = $${paramIndex}`);
      values.push(case_type);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        error: 'No fields to update',
        success: false 
      });
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add case ID to values
    values.push(id);

    const updateQuery = `
      UPDATE cases 
      SET ${updateFields.join(', ')}
      WHERE uuid_id = $${values.length}
      RETURNING uuid_id, case_description, status, case_type, updated_at
    `;

    const updateResult = await db.query(updateQuery, values);

    if (updateResult.rows.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to update case',
        success: false 
      });
    }

    // Get the complete updated case data
    const completeCase = await getCaseById(req, res);
    
    // If getCaseById was successful, it already sent the response
    if (res.headersSent) {
      return;
    }

    res.json({
      success: true,
      message: 'Case updated successfully',
      case: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Admin update case error:', error);
    res.status(500).json({ 
      error: 'Failed to update case',
      success: false 
    });
  }
};

// Update a case category (admin only) - dedicated endpoint for case categorization
const updateCaseCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { case_type } = req.body;
    
    // Valid case type options from the enum
    const validCaseTypes = [
      'uncategorized',
      'public_order_offenses', 
      'identity_and_document_fraud',
      'personal_harm',
      'child_and_family_cases',
      'property_offenses',
      'trespass_and_coercion',
      'privacy_violations',
      'threats_and_honor_offenses',
      'financial_offenses',
      'other'
    ];
    
    // Check if case exists
    const checkQuery = 'SELECT uuid_id FROM cases WHERE uuid_id = $1';
    const checkResult = await db.query(checkQuery, [id]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Case not found',
        success: false 
      });
    }

    // Validate case_type if provided
    if (!case_type) {
      return res.status(400).json({ 
        error: 'case_type is required',
        success: false 
      });
    }

    if (!validCaseTypes.includes(case_type)) {
      return res.status(400).json({ 
        error: `Invalid case type. Valid options: ${validCaseTypes.join(', ')}`,
        success: false 
      });
    }

    // Update the case category
    const updateQuery = `
      UPDATE cases 
      SET case_type = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE uuid_id = $2 
      RETURNING *
    `;
    
    const updateResult = await db.query(updateQuery, [case_type, id]);
    
    if (updateResult.rows.length === 0) {
      return res.status(500).json({ 
        error: 'Failed to update case category',
        success: false 
      });
    }

    // Return the updated case with the same structure as getCaseById
    const updatedCase = updateResult.rows[0];
    
    res.json({
      success: true,
      message: 'Case category updated successfully',
      case: {
        ...updatedCase,
        id: updatedCase.uuid_id
      }
    });
  } catch (error) {
    console.error('Admin update case category error:', error);
    res.status(500).json({ 
      error: 'Failed to update case category',
      success: false 
    });
  }
};

// Get all non-admin users
const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_login,
        u.email_verified,
        p.first_name,
        p.last_name,
        p.phone,
        (SELECT COUNT(*) FROM cases WHERE user_id = u.id) as case_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.role = false
      ORDER BY u.created_at DESC
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });
  } catch (error) {
    console.error('Admin get all users error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      success: false 
    });
  }
};

// Get a specific user by ID with their profile
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        u.id,
        u.email,
        u.created_at,
        u.updated_at,
        u.last_login,
        u.email_verified,
        u.role,
        p.first_name,
        p.middle_name,
        p.last_name,
        p.suffix,
        p.date_of_birth,
        p.sex,
        p.phone,
        p.country,
        p.province,
        p.city,
        p.barangay,
        p.sitio_purok_subdivision,
        p.house_street,
        p.created_at as profile_created_at,
        p.updated_at as profile_updated_at
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = $1 AND u.role = false
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        success: false 
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Admin get user by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user',
      success: false 
    });
  }
};

// Get all cases filed by a specific user
const getUserCases = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First verify the user exists and is not an admin
    const userQuery = 'SELECT id, role FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        success: false 
      });
    }
    
    if (userResult.rows[0].role === true) {
      return res.status(400).json({ 
        error: 'Cannot view cases for admin users',
        success: false 
      });
    }
    
    // Get all cases for this user
    const casesQuery = `
      SELECT 
        c.uuid_id as id,
        c.*,
        c.case_description as case_title,
        COALESCE(
          CONCAT_WS(' ', 
            r.first_name, 
            NULLIF(r.middle_name, ''), 
            r.last_name, 
            NULLIF(r.suffix, '')
          ), 
          'No respondent listed'
        ) as respondent_name,
        c.case_type as case_category
      FROM cases c
      LEFT JOIN respondents r ON c.uuid_id = r.case_uuid
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    
    const casesResult = await db.query(casesQuery, [id]);
    
    res.json({
      success: true,
      cases: casesResult.rows,
      total: casesResult.rows.length,
      userId: id
    });
  } catch (error) {
    console.error('Admin get user cases error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user cases',
      success: false 
    });
  }
};

// Update any user's profile (admin only)
const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profileData = req.body;
    
    // Check if user exists and is not an admin
    const userQuery = 'SELECT id, role FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [id]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        success: false 
      });
    }
    
    if (userResult.rows[0].role === true) {
      return res.status(400).json({ 
        error: 'Cannot edit admin user profiles',
        success: false 
      });
    }

    // Remove any fields that shouldn't be updated directly
    const { id: profileId, user_id, created_at, updated_at, email, role, ...allowedUpdates } = profileData;

    // Validate phone number if provided
    if (allowedUpdates.phone && !/^[0-9]{11}$/.test(allowedUpdates.phone)) {
      return res.status(400).json({ 
        error: 'Phone number must be 11 digits',
        success: false 
      });
    }

    // Update the profile using the authService
    const authService = require('../services/authService');
    const updatedProfile = await authService.updateUserProfile(id, allowedUpdates);
    
    res.json({
      success: true,
      message: 'User profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Admin update user profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update user profile',
      success: false 
    });
  }
};

// Future: Get system-wide statistics
const getSystemStatistics = async (req, res) => {
  try {
    // This is a placeholder for future implementation
    const stats = {
      totalCases: 0,
      totalUsers: 0,
      casesThisMonth: 0,
      pendingCases: 0
    };
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Admin get statistics error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      success: false 
    });
  }
};

module.exports = {
  getAllCases,
  getCaseById,
  updateCase,
  updateCaseCategory,
  deleteCase,
  getAllUsers,
  getUserById,
  getUserCases,
  updateUserProfile,
  getSystemStatistics
}; 