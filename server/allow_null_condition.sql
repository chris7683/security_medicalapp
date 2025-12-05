-- Migration to allow NULL values in patients.condition column
-- Run this with: psql -U postgres -d healthcare -f server/allow_null_condition.sql

ALTER TABLE patients 
ALTER COLUMN condition DROP NOT NULL;

-- Update any existing 'N/A' values to NULL for consistency
UPDATE patients 
SET condition = NULL 
WHERE condition = 'N/A' OR condition = '';

