-- Migration: Fix Payment System Database Schema
-- This script safely adds or updates the payments table structure

-- Create enum type for payment status (if not exists)
DO $$ BEGIN
    CREATE TYPE payment_status AS ENUM (
        'pending_verification',
        'verified',
        'rejected'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Check if payments table exists and create/update it
DO $$ 
BEGIN
    -- Check if payments table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        -- Create payments table from scratch
        CREATE TABLE payments (
            id SERIAL PRIMARY KEY,
            case_id UUID REFERENCES cases(uuid_id) ON DELETE CASCADE,
            method VARCHAR(20) CHECK (method IN ('counter', 'gcash')),
            reference_code VARCHAR(8),
            receipt_filename TEXT,
            status payment_status DEFAULT 'pending_verification',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created payments table with all columns';
    ELSE
        -- Table exists, check if updated_at column exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'payments' AND column_name = 'updated_at'
        ) THEN
            -- Add updated_at column
            ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to existing payments table';
        ELSE
            RAISE NOTICE 'Payments table already has updated_at column';
        END IF;
    END IF;
END $$;

-- Create indexes for faster lookups (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_case_id') THEN
        CREATE INDEX idx_payments_case_id ON payments(case_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_payments_reference_code') THEN
        CREATE INDEX idx_payments_reference_code ON payments(reference_code);
    END IF;
END $$;

-- Create or replace the trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update existing rows to have updated_at = created_at if updated_at is NULL
UPDATE payments SET updated_at = created_at WHERE updated_at IS NULL;

-- Verify the final structure
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'updated_at'
    ) THEN
        RAISE NOTICE 'Migration completed successfully - payments table has updated_at column';
    ELSE
        RAISE EXCEPTION 'Migration failed - updated_at column not found';
    END IF;
END $$; 