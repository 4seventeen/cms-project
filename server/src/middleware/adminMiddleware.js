const db = require('../../config/database');

/**
 * Middleware to check if the authenticated user has admin privileges
 * Must be used after authMiddleware to ensure req.user is populated
 */
const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user is authenticated (should be handled by authMiddleware first)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        error: 'Authentication required',
        admin: false 
      });
    }

    const userId = req.user.id;

    // Query the database to get the user's role
    const userQuery = 'SELECT role FROM users WHERE id = $1';
    const result = await db.query(userQuery, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'User not found',
        admin: false 
      });
    }

    const user = result.rows[0];

    // Check if user has admin role (role = true means admin)
    if (!user.role) {
      return res.status(403).json({ 
        error: 'Admin access required. Insufficient privileges.',
        admin: false 
      });
    }

    // User is admin, add admin flag to request object and proceed
    req.user.isAdmin = true;
    next();

  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ 
      error: 'Failed to verify admin privileges',
      admin: false 
    });
  }
};

module.exports = adminMiddleware; 