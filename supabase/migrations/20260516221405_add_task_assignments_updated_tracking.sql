/*
  # Add updated_at and updated_by to task_assignments

  ## Changes
  - Add `updated_at` column (auto-set on update via trigger)
  - Add `updated_by` column (uuid, stores the user id who last changed status)

  This allows the admin dashboard to show when a provider updated a job's status.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_assignments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE task_assignments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'task_assignments' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE task_assignments ADD COLUMN updated_by uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Trigger to auto-set updated_at on every update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_assignments_updated_at ON task_assignments;
CREATE TRIGGER task_assignments_updated_at
  BEFORE UPDATE ON task_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
