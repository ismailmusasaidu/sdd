/*
  # Agent System Tables

  ## New Tables

  ### agent_profiles
  - Stores registered agent accounts
  - `id` (uuid, FK to auth.users)
  - `full_name`, `email`, `phone`, `location`, `company_name` — agent details
  - `status` — approval state: 'pending' | 'approved' | 'rejected'
  - `created_at`

  ### agent_bookings
  - Bookings/service requests created by agents on behalf of clients
  - `id`, `agent_id` (FK agent_profiles), `service_type`, `hiring_type`
  - `client_name`, `client_phone`, `client_email`, `location`
  - `preferred_date`, `description`, `status`, `admin_notes`
  - `created_at`
  - These appear in the admin BookingsManagement panel alongside regular bookings

  ## Security
  - RLS enabled on both tables
  - Agents can read/update own profile
  - Agents can create bookings only when approved
  - Agents can read own bookings
  - Admin can read/update all (via service role or RLS policies using app_metadata)
*/

-- Agent profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  company_name text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can read own profile"
  ON agent_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Agents can update own profile"
  ON agent_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND status = (SELECT status FROM agent_profiles WHERE id = auth.uid()));

CREATE POLICY "Agents can insert own profile"
  ON agent_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can read all agent profiles"
  ON agent_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update all agent profiles"
  ON agent_profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Agent bookings table
CREATE TABLE IF NOT EXISTS agent_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  service_type text NOT NULL DEFAULT '',
  hiring_type text NOT NULL DEFAULT 'contract',
  client_name text NOT NULL DEFAULT '',
  client_phone text NOT NULL DEFAULT '',
  client_email text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  preferred_date date,
  description text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'confirmed', 'completed', 'cancelled')),
  admin_notes text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agent_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved agents can insert bookings"
  ON agent_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = agent_id
    AND EXISTS (
      SELECT 1 FROM agent_profiles
      WHERE id = auth.uid() AND status = 'approved'
    )
  );

CREATE POLICY "Agents can read own bookings"
  ON agent_bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = agent_id);

CREATE POLICY "Admin can read all agent bookings"
  ON agent_bookings FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin can update all agent bookings"
  ON agent_bookings FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_bookings_agent_id ON agent_bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_bookings_status ON agent_bookings(status);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_status ON agent_profiles(status);
