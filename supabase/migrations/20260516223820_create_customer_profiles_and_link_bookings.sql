/*
  # Customer Profiles & Booking Link

  ## New Tables
  - `customer_profiles`
    - `id` (uuid, references auth.users, primary key)
    - `full_name` (text)
    - `email` (text)
    - `phone` (text)
    - `location` (text)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Modified Tables
  - `service_bookings`
    - Add `customer_id` (uuid, nullable, references auth.users) so logged-in customers own their bookings

  ## Security
  - RLS enabled on customer_profiles
  - Customers can read/update only their own profile
  - Customers can read only their own bookings (via customer_id)
  - Admins retain full access
*/

-- Customer profiles table
CREATE TABLE IF NOT EXISTS customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  location text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own profile"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Customers can insert own profile"
  ON customer_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Customers can update own profile"
  ON customer_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_customer_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customer_profiles_updated_at
  BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_customer_profiles_updated_at();

-- Link bookings to customers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_bookings' AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE service_bookings ADD COLUMN customer_id uuid REFERENCES auth.users(id);
  END IF;
END $$;

-- Customers can select their own bookings
CREATE POLICY "Customers can view own bookings"
  ON service_bookings FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Customers can insert bookings linked to themselves
CREATE POLICY "Authenticated customers can insert bookings"
  ON service_bookings FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());
