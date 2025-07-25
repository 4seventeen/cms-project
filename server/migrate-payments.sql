-- Migration: Add Payment System
-- Run this SQL file in your PostgreSQL database

-- Create enum type for payment status
CREATE TYPE payment_status AS ENUM (
  'pending_verification',
  'verified',
  'rejected'
);

-- Create payments table
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

-- Create index for faster lookups
CREATE INDEX idx_payments_case_id ON payments(case_id);
CREATE INDEX idx_payments_reference_code ON payments(reference_code);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 