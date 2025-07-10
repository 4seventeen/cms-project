# Forgot Password Functionality Implementation

This document outlines the complete forgot password functionality that has been implemented in the CMS project.

## Overview

The forgot password system allows users to:
1. Request a password reset via email
2. Receive a secure reset link
3. Reset their password using the link
4. Sign in with their new password

## Backend Implementation

### Database Changes

1. **New Table**: `password_reset_tokens`
   - Stores reset tokens with expiration times
   - Links tokens to users
   - Tracks token usage

2. **Database Functions Added**:
   - `createPasswordResetToken()` - Creates new reset tokens
   - `getPasswordResetToken()` - Validates tokens
   - `markPasswordResetTokenAsUsed()` - Marks tokens as used
   - `updateUserPassword()` - Updates user passwords
   - `deleteExpiredPasswordResetTokens()` - Cleanup function

### API Endpoints

1. **POST /api/forgot-password**
   - Accepts: `{ email: string }`
   - Returns: Success message (doesn't reveal if email exists)
   - Creates reset token and logs URL (for development)

2. **POST /api/reset-password**
   - Accepts: `{ token: string, newPassword: string, confirmPassword: string }`
   - Returns: Success message
   - Validates token and updates password

### Security Features

- Tokens expire after 1 hour
- Tokens can only be used once
- No information leakage about email existence
- Secure password hashing with bcrypt
- Automatic cleanup of expired tokens

## Frontend Implementation

### New Components

1. **ForgotPassword.vue**
   - Form to request password reset
   - Email validation
   - Success/error messaging

2. **ResetPassword.vue**
   - Form to set new password
   - Token validation from URL
   - Password confirmation
   - Automatic redirect after success

### Updated Components

1. **Signin.vue**
   - Added "Forgot Password?" link
   - Links to forgot password page

2. **authService.js**
   - Added `forgotPassword()` method
   - Added `resetPassword()` method

### Routes Added

- `/forgot-password` - Forgot password form
- `/reset-password` - Reset password form (with token)

## Usage Flow

1. **User forgets password**
   - Clicks "Forgot Password?" on signin page
   - Enters email address
   - Receives success message

2. **User receives reset link**
   - In development: URL is logged to console
   - In production: Email would be sent with link

3. **User resets password**
   - Clicks reset link
   - Enters new password and confirmation
   - Password is updated
   - User is redirected to signin

## Development vs Production

### Development Mode
- Reset URLs are logged to console for testing
- No actual email sending
- Easy to test the complete flow

### Production Mode
- Integrate with email service (SendGrid, AWS SES, etc.)
- Send actual emails with reset links
- Remove URL logging from console

## Email Integration (For Production)

To add actual email sending, you would:

1. Install an email library:
   ```bash
   npm install nodemailer
   ```

2. Configure email service in `authService.js`:
   ```javascript
   const nodemailer = require('nodemailer');
   
   // Configure transporter
   const transporter = nodemailer.createTransporter({
     service: 'gmail', // or your email service
     auth: {
       user: process.env.EMAIL_USER,
       pass: process.env.EMAIL_PASS
     }
   });
   
   // Send email in forgotPassword function
   await transporter.sendMail({
     from: process.env.EMAIL_USER,
     to: user.email,
     subject: 'Password Reset Request',
     html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`
   });
   ```

## Testing

### Manual Testing
1. Start the server and client
2. Go to signin page
3. Click "Forgot Password?"
4. Enter an email that exists in your database
5. Check console for reset URL
6. Click the reset URL
7. Enter new password
8. Try signing in with new password

### Database Testing
```sql
-- Check if tokens are created
SELECT * FROM password_reset_tokens;

-- Check if tokens are cleaned up
SELECT COUNT(*) FROM password_reset_tokens WHERE expires_at < NOW();
```

## Migration

If you have an existing database, run the migration script:
```bash
psql -d your_database_name -f server/migrate-password-reset.sql
```

## Environment Variables

Add these to your `.env` file for production:
```
FRONTEND_URL=http://localhost:5173
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## Security Considerations

1. **Token Security**: Tokens are cryptographically secure random strings
2. **Expiration**: Tokens expire after 1 hour
3. **Single Use**: Tokens can only be used once
4. **No Information Leakage**: Same response for existing/non-existing emails
5. **Password Strength**: Enforces minimum 6 characters
6. **HTTPS**: Use HTTPS in production for secure transmission

## Maintenance

The system automatically:
- Cleans up expired tokens every hour
- Validates token expiration on each request
- Prevents reuse of tokens

## Troubleshooting

### Common Issues

1. **Token not found**: Check if token exists and hasn't expired
2. **Email not sent**: Check email configuration in production
3. **Password not updated**: Verify token validation logic
4. **Cleanup not working**: Check the setInterval in server/index.js

### Debug Commands

```sql
-- Check all reset tokens
SELECT * FROM password_reset_tokens ORDER BY created_at DESC;

-- Check expired tokens
SELECT * FROM password_reset_tokens WHERE expires_at < NOW();

-- Check used tokens
SELECT * FROM password_reset_tokens WHERE used = TRUE;
``` 