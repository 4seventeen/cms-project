// Database models for PostgreSQL
// Database operations are handled by the databaseService
// This file can be used for any additional model-related utilities if needed

const databaseService = require('../src/services/databaseService');

module.exports = {
  // Database service provides all CRUD operations
  databaseService,
  
  // Model utilities can be added here as needed
  // For example: validation functions, data transformers, etc.
};
