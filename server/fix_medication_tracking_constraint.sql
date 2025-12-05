-- Fix foreign key constraint on medication_tracking to allow CASCADE delete
-- This allows medications to be deleted even if they have tracking records

-- Drop the existing constraint
ALTER TABLE medication_tracking
DROP CONSTRAINT IF EXISTS medication_tracking_medication_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE medication_tracking
ADD CONSTRAINT medication_tracking_medication_id_fkey
FOREIGN KEY (medication_id)
REFERENCES medications(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

