-- Fix foreign key constraint on medications to allow CASCADE delete
-- This allows patients to be deleted even if they have medications

-- Drop the existing constraint
ALTER TABLE medications
DROP CONSTRAINT IF EXISTS medications_patient_id_fkey;

-- Recreate the constraint with ON DELETE CASCADE
ALTER TABLE medications
ADD CONSTRAINT medications_patient_id_fkey
FOREIGN KEY (patient_id)
REFERENCES patients(id)
ON UPDATE CASCADE
ON DELETE CASCADE;

