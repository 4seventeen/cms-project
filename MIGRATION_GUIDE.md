# Migration Guide: Supabase to PostgreSQL

This document outlines the complete migration from Supabase to PostgreSQL for the CMS Project.

## Overview

The project has been successfully refactored from using Supabase as a Backend-as-a-Service to a custom PostgreSQL backend with Express.js. This migration provides:

- Full control over the database schema and operations
- Custom authentication system using JWT
- Local file storage instead of cloud storage
- Better performance and reduced external dependencies

## Database Changes

### New Database Schema

The PostgreSQL database includes the following tables:

1. **users** - Replaces Supabase auth.users
2. **profiles** - Additional user profile information
3. **cases** - Case management data
4. **respondents** - People being complained about
5. **case_attachments** - File attachments for cases

### Key Changes from Supabase

- Custom user authentication with bcrypt password hashing
- JWT tokens for session management
- UUID primary keys for all entities
- Automatic timestamp management with triggers
- Foreign key constraints for data integrity

## Backend Changes

### New Services

1. **databaseService.js** - Replaces Supabase client with PostgreSQL queries
2. **authService.js** - Custom authentication with JWT
3. **fileStorage.js** - Local file storage using multer

### Updated Controllers

- **authController.js** - Handles signup, signin, profile management
- **caseController.js** - CRUD operations for cases with file upload support

### New Middleware

- **authMiddleware.js** - JWT token verification
- **fileStorage.js** - Multer configuration for file uploads

## Frontend Changes

### Removed Dependencies

- `@supabase/supabase-js` - No longer needed

### New Services

1. **authService.js** - Client-side authentication service
2. **api.js** - Enhanced with token management and error handling

### Updated Components

- All Vue components updated to use new authentication system
- File upload functionality migrated to use FormData and multipart requests
- Local storage used for token and user data management

## Setup Instructions

### Prerequisites

1. PostgreSQL database server
2. Node.js and npm
3. Git

### Database Setup

1. Install PostgreSQL on your system
2. Create a new database:
   ```sql
   CREATE DATABASE cms_project;
   ```
3. Run the schema creation script:
   ```bash
   psql -d cms_project -f server/config/schema.sql
   ```

### Server Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_DATABASE=cms_project
   POSTGRES_USER=your_username
   POSTGRES_PASSWORD=your_password
   JWT_SECRET=your_super_secret_jwt_key
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

### Client Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:3001/api
   ```

5. Start the client:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/signup` - Create new user
- `POST /api/signin` - Sign in user
- `GET /api/user` - Get current user (protected)
- `PUT /api/profile` - Update user profile (protected)
- `POST /api/change-password` - Change password (protected)
- `POST /api/logout` - Logout user

### Cases
- `GET /api/cases` - Get user's cases (protected)
- `GET /api/cases/:id` - Get specific case (protected)
- `POST /api/cases` - Create new case (protected)
- `PUT /api/cases/:id` - Update case (protected)
- `DELETE /api/cases/:id` - Delete case (protected)

### File Management
- `POST /api/cases/:caseId/attachments` - Upload files (protected)
- `GET /api/cases/:caseId/attachments/:attachmentId/download` - Download file (protected)

### System
- `GET /api/health` - Health check

## File Storage

Files are now stored locally in the `server/uploads/case-attachments/` directory, organized by case ID. Each case has its own subdirectory for better organization.

### File Upload Features

- Maximum file size: 10MB
- Maximum files per upload: 5
- Supported file types: Images, PDFs, documents
- Automatic filename generation to prevent conflicts
- Secure access control (users can only access their own case files)

## Security Improvements

1. **Password Security**: Bcrypt hashing with 12 salt rounds
2. **JWT Security**: Configurable secret key and expiration time
3. **File Security**: Access control and file type validation
4. **Database Security**: Parameterized queries prevent SQL injection
5. **API Security**: Authentication middleware on all protected routes

## Testing the Migration

1. **Database Connection**: Check `/api/health` endpoint
2. **User Registration**: Test signup functionality
3. **Authentication**: Test signin/signout flow
4. **Case Management**: Create, read, update, delete cases
5. **File Upload**: Test file attachment functionality
6. **File Download**: Test file download functionality

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection credentials in `.env`
   - Ensure database exists and schema is created

2. **JWT Token Issues**
   - Verify `JWT_SECRET` is set in environment
   - Check token expiration settings
   - Clear browser localStorage and retry

3. **File Upload Issues**
   - Check file size limits
   - Verify upload directory permissions
   - Ensure multer middleware is properly configured

4. **CORS Issues**
   - Verify client URL is in CORS whitelist
   - Check API base URL configuration

## Migration Benefits

1. **Performance**: Direct database access is faster than API calls
2. **Control**: Full control over data schema and operations
3. **Security**: Custom authentication and authorization
4. **Cost**: No external service fees
5. **Reliability**: No dependency on external service availability
6. **Customization**: Easy to extend and modify functionality

## Rollback Plan

If needed, the project can be rolled back to Supabase by:

1. Reverting to the previous Git commit before migration
2. Restoring the Supabase configuration
3. Migrating data from PostgreSQL back to Supabase (if needed)

However, the new PostgreSQL implementation is recommended for its improved performance and control.

## Support

For issues related to the migration, please check:

1. PostgreSQL logs for database issues
2. Server console output for backend errors  
3. Browser console for frontend errors
4. Network tab for API request/response details 