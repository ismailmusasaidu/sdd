/*
  # Add admin SELECT policy on customer_profiles

  The customer_profiles table only had a self-select policy (users can read
  their own row). The admin had no SELECT access, so the admin Messages panel
  received an empty customer list.

  Also adds admin SELECT on agent_profiles for consistency (agents already
  work, but explicit is safer).
*/

CREATE POLICY "Admin can view all customer profiles"
  ON customer_profiles FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
