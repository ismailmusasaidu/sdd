/*
  # Create Admin Tables for Provider Management and Task Assignment

  1. New Tables
    - `provider_reviews` - Store reviews for providers
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to provider_profiles)
      - `customer_name` (text)
      - `rating` (numeric, 1-5)
      - `comment` (text)
      - `status` (text: approved, rejected, pending)
      - `created_at` (timestamp)
    
    - `task_assignments` - Track task assignments to providers
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to provider_profiles)
      - `service_type` (text)
      - `customer_name` (text)
      - `customer_phone` (text)
      - `location` (text)
      - `description` (text)
      - `status` (text: assigned, in_progress, completed, cancelled)
      - `assigned_date` (timestamp)
      - `completion_date` (timestamp, nullable)
      - `priority` (text: low, medium, high)
    
    - `admin_logs` - Track admin actions
      - `id` (uuid, primary key)
      - `admin_id` (uuid, foreign key to auth.users)
      - `action` (text)
      - `target_type` (text: provider, review, task)
      - `target_id` (uuid)
      - `details` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Create policies for admin-only access
    - Admins identified by role in auth.users metadata
*/

CREATE TABLE IF NOT EXISTS provider_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  status text DEFAULT 'pending' CHECK (status IN ('approved', 'rejected', 'pending')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all reviews"
  ON provider_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can create reviews"
  ON provider_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update reviews"
  ON provider_reviews FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete reviews"
  ON provider_reviews FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  location text NOT NULL,
  description text,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assigned_date timestamptz DEFAULT now(),
  completion_date timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all tasks"
  ON task_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can create tasks"
  ON task_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update tasks"
  ON task_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete tasks"
  ON task_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('provider', 'review', 'task')),
  target_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view logs"
  ON admin_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can create logs"
  ON admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE INDEX idx_provider_reviews_provider_id ON provider_reviews(provider_id);
CREATE INDEX idx_provider_reviews_status ON provider_reviews(status);
CREATE INDEX idx_task_assignments_provider_id ON task_assignments(provider_id);
CREATE INDEX idx_task_assignments_status ON task_assignments(status);
CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);
