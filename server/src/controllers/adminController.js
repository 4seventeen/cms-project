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
      'Unknown' as respondent_name,
      c.case_type as case_category
    FROM cases c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
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
      p.last_name as complainant_last_name,
      p.phone as complainant_phone,
      c.case_description as case_title,
      'Unknown' as respondent_name,
      c.case_type as case_category
    FROM cases c
    LEFT JOIN users u ON c.user_id = u.id
    LEFT JOIN profiles p ON u.id = p.user_id
    WHERE c.uuid_id = $1
  `;
    
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Case not found',
        success: false 
      });
    }
    
    res.json({
      success: true,
      case: result.rows[0]
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
        u.last_login,
        u.email_verified,
        u.role,
        p.*
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
        uuid_id as id,
        *,
        case_description as case_title,
        'Unknown' as respondent_name,
        case_type as case_category
      FROM cases
      WHERE user_id = $1
      ORDER BY created_at DESC
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
  deleteCase,
  getAllUsers,
  getUserById,
  getUserCases,
  getSystemStatistics
}; 