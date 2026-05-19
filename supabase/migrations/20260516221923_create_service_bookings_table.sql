/*
  # Create service_bookings table

  ## New Tables
  - `service_bookings`
    - `id` (uuid, primary key)
    - `service_type` (text) — e.g. "Cleaning", "Plumbing"
    - `hiring_type` (text) — "contract" or "permanent"
    - `customer_name` (text)
    - `customer_phone` (text)
    - `customer_email` (text, optional)
    - `location` (text)
    - `preferred_date` (date, optional)
    - `description` (text, optional) — additional details
    - `status` (text) — "new", "contacted", "confirmed", "completed", "cancelled"
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Anyone (anonymous or authenticated) can INSERT a booking (public form)
  - Only admins (app_metadata.role = 'admin') can SELECT, UPDATE, DELETE
*/

CREATE TABLE IF NOT EXISTS service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type text NOT NULL,
  hiring_type text NOT NULL DEFAULT 'contract',
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text DEFAULT '',
  location text NOT NULL,
  preferred_date date,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Public can submit bookings (INSERT only, no read-back)
CREATE POLICY "Anyone can submit a booking"
  ON service_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view bookings
CREATE POLICY "Admins can view all bookings"
  ON service_bookings FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only admins can update bookings
CREATE POLICY "Admins can update bookings"
  ON service_bookings FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Only admins can delete bookings
CREATE POLICY "Admins can delete bookings"
  ON service_bookings FOR DELETE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_service_bookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER service_bookings_updated_at
  BEFORE UPDATE ON service_bookings
  FOR EACH ROW EXECUTE FUNCTION set_service_bookings_updated_at();
