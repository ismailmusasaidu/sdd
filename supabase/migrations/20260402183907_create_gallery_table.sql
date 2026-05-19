/*
  # Create Gallery Table for Client Work Samples

  1. New Tables
    - `gallery`
      - `id` (uuid, primary key) - Unique identifier for each gallery item
      - `title` (text) - Title of the work/project
      - `description` (text) - Description of the work/project
      - `service_category` (text) - Service category (Cleaner, Driver, Electrician, etc.)
      - `image_url` (text) - URL to the image
      - `client_name` (text) - Name of the client (optional)
      - `before_image_url` (text) - Before image URL for before/after comparison
      - `order` (integer) - Display order
      - `is_featured` (boolean) - Whether to feature on homepage
      - `created_at` (timestamptz) - Timestamp of creation
      - `updated_at` (timestamptz) - Timestamp of last update

  2. Security
    - Enable RLS on `gallery` table
    - Add policy for public read access (anyone can view gallery)
    - Add policy for authenticated admin users to manage gallery
*/

CREATE TABLE IF NOT EXISTS gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  service_category text NOT NULL,
  image_url text NOT NULL,
  client_name text,
  before_image_url text,
  "order" integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view gallery"
  ON gallery
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can view gallery"
  ON gallery
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage gallery"
  ON gallery
  FOR ALL
  TO authenticated
  USING (
    (SELECT auth.jwt()->>'role') = 'admin'
  )
  WITH CHECK (
    (SELECT auth.jwt()->>'role') = 'admin'
  );
