# Database Fix Instructions

## Issue
The payment system is failing with the error: `column "updated_at" does not exist` because the payments table was created without the `updated_at` column.

## Solution
Run the database migration script to add the missing column.

## Steps to Fix

### Option 1: Run Migration Script (Recommended)

1. **Connect to your PostgreSQL database** using your preferred method:
   ```bash
   # Using psql command line
   psql -U your_username -d your_database_name
   
   # Or using pgAdmin, DBeaver, or other GUI tools
   ```

2. **Run the migration script**:
   ```bash
   # From the project root directory
   psql -U your_username -d your_database_name -f server/migrate-payments-fix.sql
   ```

   Or copy and paste the contents of `server/migrate-payments-fix.sql` into your SQL client.

3. **Verify the fix**:
   ```sql
   -- Check if the updated_at column exists
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'payments' AND column_name = 'updated_at';
   
   -- Should return one row showing the updated_at column
   ```

### Option 2: Manual Fix (Alternative)

If you prefer to run the commands manually:

```sql
-- Add the missing column
ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Update existing rows
UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL;

-- Create the trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Code Changes Made

### 1. Graceful Error Handling
The payment controller now handles the missing `updated_at` column gracefully:

- If `updated_at` exists: normal operation
- If `updated_at` missing: falls back to using `created_at`

### 2. Backward Compatibility
The system will work with both:
- New installations (with `updated_at` column)
- Existing installations (without `updated_at` column)

## Testing After Fix

1. **Start the servers**:
   ```bash
   # Terminal 1 - Backend
   cd server && npm start
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

2. **Test the payment flow**:
   - File a complaint
   - Navigate to payment page
   - Should no longer show database errors

3. **Verify in database**:
   ```sql
   -- Check payments table structure
   \d payments
   
   -- Check if records are being created properly
   SELECT * FROM payments ORDER BY created_at DESC LIMIT 5;
   ```

## What the Migration Does

1. **Creates payment_status enum** (if not exists)
2. **Creates payments table** (if not exists) with all required columns
3. **Adds updated_at column** (if table exists but column missing)
4. **Creates indexes** for better performance
5. **Sets up triggers** for automatic updated_at updates
6. **Updates existing data** to have proper updated_at values

## Verification

After running the migration, you should see these success messages:
- `NOTICE: Added updated_at column to existing payments table`
- `NOTICE: Migration completed successfully - payments table has updated_at column`

## Troubleshooting

If you still get errors after running the migration:

1. **Check PostgreSQL logs** for any error details
2. **Verify user permissions** - ensure your database user can ALTER tables
3. **Restart the Node.js server** after running the migration
4. **Check table structure**:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns 
   WHERE table_name = 'payments'
   ORDER BY ordinal_position;
   ```

The payment system should work correctly after applying this fix! 