/*
  # Service Provider Authentication and Profile System

  1. New Tables
    - `provider_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `service_category` (text)
      - `experience_years` (integer)
      - `bio` (text)
      - `location` (text)
      - `status` (text: pending, verified, suspended)
      - `rating` (numeric, default 0)
      - `total_jobs` (integer, default 0)
      - `profile_image_url` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `provider_documents`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, references provider_profiles)
      - `document_type` (text: id_card, certificate, reference)
      - `document_url` (text)
      - `status` (text: pending, approved, rejected)
      - `uploaded_at` (timestamptz)
    
    - `provider_availability`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, references provider_profiles)
      - `day_of_week` (text)
      - `start_time` (time)
      - `end_time` (time)
      - `is_available` (boolean, default true)

  2. Security
    - Enable RLS on all tables
    - Providers can read and update their own profiles
    - Only authenticated providers can access their data
*/

CREATE TABLE IF NOT EXISTS provider_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text NOT NULL,
  service_category text NOT NULL,
  experience_years integer DEFAULT 0,
  bio text DEFAULT '',
  location text NOT NULL,
  status text DEFAULT 'pending',
  rating numeric(3, 2) DEFAULT 0,
  total_jobs integer DEFAULT 0,
  profile_image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provider_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  day_of_week text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_available boolean DEFAULT true
);

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own profile"
  ON provider_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Providers can update own profile"
  ON provider_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Anyone can insert provider profile"
  ON provider_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Providers can view own availability"
  ON provider_availability
  FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert own availability"
  ON provider_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update own availability"
  ON provider_availability
  FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can delete own availability"
  ON provider_availability
  FOR DELETE
  TO authenticated
  USING (provider_id = auth.uid());
