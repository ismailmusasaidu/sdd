/*
  # Business Profiles and Bookings

  1. New Tables
    - `business_profiles`
      - `id` (uuid, PK, links to auth.users)
      - `company_name` (text)
      - `contact_name` (text) - primary contact person
      - `email` (text)
      - `phone` (text)
      - `location` (text)
      - `industry` (text)
      - `company_size` (text) - e.g. "1-10", "11-50", etc.
      - `status` (text) - pending | approved | rejected
      - `admin_notes` (text)
      - `created_at` (timestamptz)

    - `business_bookings`
      - `id` (uuid, PK)
      - `business_id` (uuid, FK -> business_profiles)
      - `service_type` (text)
      - `hiring_type` (text) - contract | permanent
      - `workers_needed` (int) - how many workers
      - `location` (text)
      - `preferred_date` (date, nullable)
      - `description` (text, nullable)
      - `status` (text) - new | contacted | confirmed | completed | cancelled
      - `admin_notes` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Businesses can read/update their own profile
    - Businesses can read/insert their own bookings
    - Admin access is handled via service role
*/

-- Business profiles
CREATE TABLE IF NOT EXISTS business_profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name  text NOT NULL DEFAULT '',
  contact_name  text NOT NULL DEFAULT '',
  email         text NOT NULL DEFAULT '',
  phone         text NOT NULL DEFAULT '',
  location      text NOT NULL DEFAULT '',
  industry      text NOT NULL DEFAULT '',
  company_size  text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'pending',
  admin_notes   text NOT NULL DEFAULT '',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business can read own profile"
  ON business_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Business can update own profile"
  ON business_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Business can insert own profile"
  ON business_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Business bookings
CREATE TABLE IF NOT EXISTS business_bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  service_type     text NOT NULL DEFAULT '',
  hiring_type      text NOT NULL DEFAULT 'contract',
  workers_needed   integer NOT NULL DEFAULT 1,
  location         text NOT NULL DEFAULT '',
  preferred_date   date,
  description      text,
  status           text NOT NULL DEFAULT 'new',
  admin_notes      text NOT NULL DEFAULT '',
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE business_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business can read own bookings"
  ON business_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_bookings.business_id
      AND business_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Business can insert own bookings"
  ON business_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_bookings.business_id
      AND business_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Business can update own bookings"
  ON business_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_bookings.business_id
      AND business_profiles.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_bookings.business_id
      AND business_profiles.id = auth.uid()
    )
  );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS business_bookings_business_id_idx ON business_bookings(business_id);
