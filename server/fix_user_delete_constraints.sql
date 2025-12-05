-- Fix foreign key constraints to allow user deletion
-- This script updates foreign key constraints to SET NULL on delete
-- so that when a user is deleted, related records are updated instead of blocking deletion

-- 1. Drop existing foreign key constraints on patients table
-- Use CASCADE to drop dependent objects if any
ALTER TABLE patients 
  DROP CONSTRAINT IF EXISTS patients_assigned_doctor_fkey CASCADE;

ALTER TABLE patients 
  DROP CONSTRAINT IF EXISTS patients_assigned_nurse_fkey CASCADE;

-- 2. Recreate with ON DELETE SET NULL
ALTER TABLE patients 
  ADD CONSTRAINT patients_assigned_doctor_fkey 
  FOREIGN KEY (assigned_doctor) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

ALTER TABLE patients 
  ADD CONSTRAINT patients_assigned_nurse_fkey 
  FOREIGN KEY (assigned_nurse) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- 3. Fix users.assigned_nurse_id constraint if it exists
-- First check if constraint exists and drop it
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'fk_user_assigned_nurse'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT fk_user_assigned_nurse CASCADE;
  END IF;
END $$;

-- Recreate with ON DELETE SET NULL
ALTER TABLE users 
  ADD CONSTRAINT fk_user_assigned_nurse 
  FOREIGN KEY (assigned_nurse_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- 4. Fix medications.prescribed_by constraint
-- Since prescribed_by is NOT NULL, we'll use CASCADE to delete medications when user is deleted
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'medications_prescribed_by_fkey'
  ) THEN
    ALTER TABLE medications DROP CONSTRAINT medications_prescribed_by_fkey;
  END IF;
END $$;

ALTER TABLE medications 
  ADD CONSTRAINT medications_prescribed_by_fkey 
  FOREIGN KEY (prescribed_by) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- 5. Fix medication_tracking.tracked_by constraint
-- Since tracked_by is NOT NULL, we'll use CASCADE to delete tracking records when user is deleted
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'medication_tracking_tracked_by_fkey'
  ) THEN
    ALTER TABLE medication_tracking DROP CONSTRAINT medication_tracking_tracked_by_fkey;
  END IF;
END $$;

ALTER TABLE medication_tracking 
  ADD CONSTRAINT medication_tracking_tracked_by_fkey 
  FOREIGN KEY (tracked_by) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- 6. Verify all constraints were updated
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  CASE 
    WHEN confdeltype = 'n' THEN 'NO ACTION'
    WHEN confdeltype = 'r' THEN 'RESTRICT'
    WHEN confdeltype = 'c' THEN 'CASCADE'
    WHEN confdeltype = 'a' THEN 'SET NULL'
    WHEN confdeltype = 'd' THEN 'SET DEFAULT'
  END AS on_delete_action
FROM pg_constraint
WHERE conname IN (
  'patients_assigned_doctor_fkey',
  'patients_assigned_nurse_fkey',
  'fk_user_assigned_nurse',
  'medications_prescribed_by_fkey',
  'medication_tracking_tracked_by_fkey'
)
ORDER BY conname;

