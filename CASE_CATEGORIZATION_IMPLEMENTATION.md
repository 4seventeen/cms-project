# Case Categorization Implementation

## Overview
This document describes the implementation of case categorization functionality in the CMS project. The feature allows admins to categorize cases while restricting regular users to view-only access.

## Features Implemented

### ✅ Backend API
- **New Endpoint**: `PATCH /api/admin/cases/:id/category`
- **Authentication**: Admin-only access enforced via middleware
- **Validation**: Validates case_type against predefined enum values
- **Response**: Returns updated case data after successful update

### ✅ Case Type Enum Values
The following case types are supported:
- `uncategorized` (default for new cases)
- `public_order_offenses`
- `identity_and_document_fraud`
- `personal_harm`
- `child_and_family_cases`
- `property_offenses`
- `trespass_and_coercion`
- `privacy_violations`
- `threats_and_honor_offenses`
- `financial_offenses`
- `other`

### ✅ Frontend Implementation
- **Admin Edit Page**: Dropdown select menu for case_type in AdminEditCase.vue
- **Case Details Page**: Read-only text display of case category for all users  
- **Regular User Edit**: No access to change case_type (admin-only feature)
- **Real-time Updates**: State updates without page reload after successful API calls
- **Error Handling**: User-friendly error messages and proper form validation

### ✅ Default Behavior
- New cases are automatically set to `uncategorized` when filed
- Only admins can change case categories via the admin edit page
- Regular users see case type as read-only text in case details
- Proper authorization ensures regular users cannot modify case categories

## API Endpoints

### Update Case Category (Admin Only)
```
PATCH /api/admin/cases/:id/category
Authorization: Admin required
Content-Type: application/json

Body:
{
  "case_type": "public_order_offenses"
}

Response:
{
  "success": true,
  "message": "Case category updated successfully",
  "case": {
    "id": "uuid",
    "case_type": "public_order_offenses",
    "updated_at": "2024-01-01T00:00:00.000Z",
    ...
  }
}
```

## Frontend Components

### CaseDetail.vue Changes
- Added formatCaseType utility function for consistent display
- Shows case_type as read-only text for all users (admin and regular)
- No edit capabilities - pure display component for case information

### AdminEditCase.vue Changes  
- Added case type dropdown with all enum options
- Form validation for case_type field
- Integrated with existing admin case update flow
- Real-time form updates with proper error handling

### EditCase.vue (Regular Users)
- No changes needed - regular users cannot edit case types
- Maintains existing functionality for case description editing only

### AuthService Changes
- Added `updateCaseCategory(caseId, caseType)` method
- Handles admin-specific API calls to the categorization endpoint

## Database Changes
- No schema changes required
- Updated case creation to set default `case_type` to 'uncategorized'
- Admin controller enforces enum validation server-side

## Security
- Admin middleware enforces role-based access control
- Category updates restricted to admin users only
- Input validation prevents invalid case types
- Proper error responses for unauthorized access attempts

## Testing
To test the implementation:

1. **As Admin:**
   - Navigate to any case detail page
   - Verify case type appears as read-only text
   - Click "Edit Case" to go to admin edit page  
   - Verify dropdown appears with all category options in AdminEditCase.vue
   - Change category and confirm update without page reload
   - Return to case details and verify category change persists

2. **As Regular User:**
   - Navigate to any case detail page
   - Verify case type appears as read-only text
   - Click "Edit Case" to go to regular edit page
   - Verify no case type dropdown appears (admin-only feature)
   - Confirm only case description can be edited

3. **API Testing:**
   - Test unauthorized access returns 403
   - Test invalid case types return 400 with validation errors
   - Test successful updates return proper response format

## Files Modified

### Backend
- `server/routes/adminRoutes.js` - Added category endpoint route
- `server/src/controllers/adminController.js` - Added updateCaseCategory method
- `server/src/controllers/caseController.js` - Added default uncategorized for new cases
- `client/src/services/authService.js` - Added updateCaseCategory client method

### Frontend
- `client/src/views/CaseDetail.vue` - Added formatCaseType utility, read-only case type display
- `client/src/views/admin/AdminEditCase.vue` - Added case type dropdown and validation
- `client/src/services/authService.js` - Added API method for category updates

## Implementation Notes
- Uses PATCH method following REST conventions for partial resource updates
- Maintains backward compatibility with existing case management
- Leverages existing admin middleware and authentication system
- Optimistic UI updates with proper error handling and rollback
- Follows established patterns for admin-only functionality 