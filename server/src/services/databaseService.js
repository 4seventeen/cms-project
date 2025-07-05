const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Database service for PostgreSQL operations
 * Replaces the Supabase service
 */

// Test database connection
async function testConnection() {
  try {
    const result = await db.testConnection();
    return { success: true, message: 'PostgreSQL connection working!' };
  } catch (error) {
    throw new Error(`PostgreSQL connection failed: ${error.message}`);
  }
}

// User operations
async function createUser(userData) {
  const { email, password_hash, username } = userData;
  const id = uuidv4();
  
  const query = `
    INSERT INTO users (id, email, password_hash, username)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, username, created_at, email_verified
  `;
  
  try {
    const result = await db.query(query, [id, email, password_hash, username]);
    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Email already exists');
    }
    throw new Error(`Error creating user: ${error.message}`);
  }
}

async function getUserByEmail(email) {
  const query = `
    SELECT id, email, password_hash, username, created_at, email_verified, last_login
    FROM users 
    WHERE email = $1
  `;
  
  try {
    const result = await db.query(query, [email]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
}

async function getUserById(id) {
  const query = `
    SELECT id, email, username, created_at, email_verified, last_login
    FROM users 
    WHERE id = $1
  `;
  
  try {
    const result = await db.query(query, [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error fetching user: ${error.message}`);
  }
}

async function updateUserLastLogin(id) {
  const query = `
    UPDATE users 
    SET last_login = NOW()
    WHERE id = $1
    RETURNING id, email, username, last_login
  `;
  
  try {
    const result = await db.query(query, [id]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating user login: ${error.message}`);
  }
}

// Profile operations
async function createProfile(profileData) {
  const {
    user_id,
    first_name,
    middle_name,
    last_name,
    suffix,
    birth_date,
    gender,
    phone_number,
    address_line1,
    address_line2,
    city,
    province,
    postal_code,
    occupation
  } = profileData;
  
  const id = uuidv4();
  
  const query = `
    INSERT INTO profiles (
      id, user_id, first_name, middle_name, last_name, suffix,
      birth_date, gender, phone_number, address_line1, address_line2,
      city, province, postal_code, occupation
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [
      id, user_id, first_name, middle_name, last_name, suffix,
      birth_date, gender, phone_number, address_line1, address_line2,
      city, province, postal_code, occupation
    ]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating profile: ${error.message}`);
  }
}

async function getProfileByUserId(user_id) {
  const query = `
    SELECT * FROM profiles 
    WHERE user_id = $1
  `;
  
  try {
    const result = await db.query(query, [user_id]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error fetching profile: ${error.message}`);
  }
}

async function updateProfile(user_id, updates) {
  const fields = [];
  const values = [];
  let valueIndex = 1;
  
  // Build dynamic update query
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${valueIndex}`);
      values.push(updates[key]);
      valueIndex++;
    }
  });
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(user_id);
  const query = `
    UPDATE profiles 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE user_id = $${valueIndex}
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating profile: ${error.message}`);
  }
}

// Case operations
async function createCase(caseData) {
  const { user_id, case_description, status = 'pending', case_type } = caseData;
  const uuid_id = uuidv4();
  
  const query = `
    INSERT INTO cases (uuid_id, user_id, case_description, status, case_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [uuid_id, user_id, case_description, status, case_type]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating case: ${error.message}`);
  }
}

async function getCasesByUserId(user_id) {
  const query = `
    SELECT 
      c.uuid_id as id,
      c.user_id,
      c.case_description,
      c.status,
      c.case_type,
      c.created_at,
      c.updated_at,
      c.resolved_at,
      c.hearing_date,
      json_agg(
        DISTINCT jsonb_build_object(
          'id', r.uuid_id,
          'first_name', r.first_name,
          'middle_name', r.middle_name,
          'last_name', r.last_name,
          'suffix', r.suffix,
          'sitio_purok_subd', r.sitio_purok_subd,
          'house_no_street', r.house_no_street
        )
      ) FILTER (WHERE r.uuid_id IS NOT NULL) as respondents,
      json_agg(
        DISTINCT jsonb_build_object(
          'id', ca.uuid_id,
          'file_name', ca.file_name,
          'file_type', ca.file_type,
          'file_size', ca.file_size,
          'storage_path', ca.storage_path
        )
      ) FILTER (WHERE ca.uuid_id IS NOT NULL) as attachments
    FROM cases c
    LEFT JOIN respondents r ON c.uuid_id = r.case_uuid
    LEFT JOIN case_attachments ca ON c.uuid_id = ca.case_uuid
    WHERE c.user_id = $1
    GROUP BY c.uuid_id, c.user_id, c.case_description, c.status, c.case_type, 
             c.created_at, c.updated_at, c.resolved_at, c.hearing_date
    ORDER BY c.created_at DESC
  `;
  
  try {
    const result = await db.query(query, [user_id]);
    return result.rows;
  } catch (error) {
    throw new Error(`Error fetching cases: ${error.message}`);
  }
}

async function getCaseById(case_id, user_id) {
  const query = `
    SELECT 
      c.uuid_id as id,
      c.user_id,
      c.case_description,
      c.status,
      c.case_type,
      c.created_at,
      c.updated_at,
      c.resolved_at,
      c.hearing_date,
      json_agg(
        DISTINCT jsonb_build_object(
          'id', r.uuid_id,
          'first_name', r.first_name,
          'middle_name', r.middle_name,
          'last_name', r.last_name,
          'suffix', r.suffix,
          'sitio_purok_subd', r.sitio_purok_subd,
          'house_no_street', r.house_no_street
        )
      ) FILTER (WHERE r.uuid_id IS NOT NULL) as respondents,
      json_agg(
        DISTINCT jsonb_build_object(
          'id', ca.uuid_id,
          'file_name', ca.file_name,
          'file_type', ca.file_type,
          'file_size', ca.file_size,
          'storage_path', ca.storage_path
        )
      ) FILTER (WHERE ca.uuid_id IS NOT NULL) as attachments
    FROM cases c
    LEFT JOIN respondents r ON c.uuid_id = r.case_uuid
    LEFT JOIN case_attachments ca ON c.uuid_id = ca.case_uuid
    WHERE c.uuid_id = $1 AND c.user_id = $2
    GROUP BY c.uuid_id, c.user_id, c.case_description, c.status, c.case_type, 
             c.created_at, c.updated_at, c.resolved_at, c.hearing_date
  `;
  
  try {
    const result = await db.query(query, [case_id, user_id]);
    return result.rows[0] || null;
  } catch (error) {
    throw new Error(`Error fetching case: ${error.message}`);
  }
}

async function updateCase(case_id, user_id, updates) {
  const fields = [];
  const values = [];
  let valueIndex = 1;
  
  // Build dynamic update query
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${valueIndex}`);
      values.push(updates[key]);
      valueIndex++;
    }
  });
  
  if (fields.length === 0) {
    throw new Error('No fields to update');
  }
  
  values.push(case_id, user_id);
  const query = `
    UPDATE cases 
    SET ${fields.join(', ')}, updated_at = NOW()
    WHERE uuid_id = $${valueIndex} AND user_id = $${valueIndex + 1}
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error updating case: ${error.message}`);
  }
}

async function deleteCase(case_id, user_id) {
  const query = `
    DELETE FROM cases 
    WHERE uuid_id = $1 AND user_id = $2
    RETURNING uuid_id
  `;
  
  try {
    const result = await db.query(query, [case_id, user_id]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error deleting case: ${error.message}`);
  }
}

// Respondent operations
async function createRespondent(respondentData) {
  const {
    case_uuid,
    first_name,
    middle_name,
    last_name,
    suffix,
    sitio_purok_subd,
    house_no_street
  } = respondentData;
  
  const uuid_id = uuidv4();
  
  const query = `
    INSERT INTO respondents (
      uuid_id, case_uuid, first_name, middle_name, last_name, 
      suffix, sitio_purok_subd, house_no_street
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [
      uuid_id, case_uuid, first_name, middle_name, last_name,
      suffix, sitio_purok_subd, house_no_street
    ]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating respondent: ${error.message}`);
  }
}

// Attachment operations
async function createAttachment(attachmentData) {
  const {
    case_uuid,
    file_name,
    file_type,
    file_size,
    storage_path,
    uploaded_by
  } = attachmentData;
  
  const uuid_id = uuidv4();
  
  const query = `
    INSERT INTO case_attachments (
      uuid_id, case_uuid, file_name, file_type, file_size, storage_path, uploaded_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  try {
    const result = await db.query(query, [
      uuid_id, case_uuid, file_name, file_type, file_size, storage_path, uploaded_by
    ]);
    return result.rows[0];
  } catch (error) {
    throw new Error(`Error creating attachment: ${error.message}`);
  }
}

module.exports = {
  testConnection,
  createUser,
  getUserByEmail,
  getUserById,
  updateUserLastLogin,
  createProfile,
  getProfileByUserId,
  updateProfile,
  createCase,
  getCasesByUserId,
  getCaseById,
  updateCase,
  deleteCase,
  createRespondent,
  createAttachment
}; 