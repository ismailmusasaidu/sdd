/*
  # Fix task_assignments RLS policies

  ## Problem
  Existing policies use EXISTS (SELECT 1 FROM auth.users ...) which fails because
  authenticated users cannot query auth.users directly. This causes all admin
  operations (insert, update, delete, select) to fail with RLS violations.

  ## Fix
  Replace all policies to use auth.jwt() -> 'app_metadata' ->> 'role' which
  reads directly from the JWT token without needing a subquery on auth.users.
*/

-- Drop broken policies
DROP POLICY IF EXISTS "Admins can view all tasks" ON task_assignments;
DROP POLICY IF EXISTS "Admins can create tasks" ON task_assignments;
DROP POLICY IF EXISTS "Admins can update tasks" ON task_assignments;
DROP POLICY IF EXISTS "Admins can delete tasks" ON task_assignments;

-- Admins see all tasks; providers see only their own
CREATE POLICY "Admins can view all tasks"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR provider_id = auth.uid()
  );

-- Only admins can insert
CREATE POLICY "Admins can create tasks"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Admins can update any task; providers can update status on their own
CREATE POLICY "Admins can update tasks"
  ON task_assignments FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR provider_id = auth.uid()
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR provider_id = auth.uid()
  );

-- Only admins can delete
CREATE POLICY "Admins can delete tasks"
  ON task_assignments FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
