-- Migration to add 'terminated' status to cases table
-- Run this SQL to update the database schema

-- Drop the existing status check constraint
ALTER TABLE cases DROP CONSTRAINT IF EXISTS cases_status_check;

-- Add the new constraint with 'terminated' status included
ALTER TABLE cases ADD CONSTRAINT cases_status_check 
CHECK (status::text = ANY (ARRAY[
  'pending'::character varying::text, 
  'in progress'::character varying::text, 
  'resolved'::character varying::text, 
  'open'::character varying::text, 
  'closed'::character varying::text,
  'terminated'::character varying::text
]));

-- Verify the constraint was added
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'cases_status_check'; 