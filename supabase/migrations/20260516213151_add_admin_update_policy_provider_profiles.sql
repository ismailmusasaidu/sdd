/*
  # Add admin UPDATE policy for provider_profiles

  1. Changes
    - Adds an UPDATE policy on provider_profiles allowing admins to update any row
      (needed for approving/rejecting providers from the admin dashboard)

  2. Security
    - Policy checks auth.jwt() app_metadata role so only actual admins can use it
*/

CREATE POLICY "Admins can update all provider profiles"
  ON provider_profiles FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
