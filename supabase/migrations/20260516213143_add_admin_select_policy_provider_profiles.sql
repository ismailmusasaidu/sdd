/*
  # Add admin SELECT policy for provider_profiles

  1. Changes
    - Adds a SELECT policy on provider_profiles allowing users with role='admin'
      in app_metadata to read all rows (needed for the admin dashboard provider list)

  2. Security
    - Policy checks auth.jwt() app_metadata role so only actual admins can use it
    - Regular providers are still restricted to their own row via existing policy
*/

CREATE POLICY "Admins can view all provider profiles"
  ON provider_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
