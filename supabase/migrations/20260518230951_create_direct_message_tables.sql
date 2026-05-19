/*
  # Create direct message tables for customer and business

  The existing customer_messages and business_messages tables are tied to
  booking_id (NOT NULL) and serve as booking-level chat threads in the
  customer/business dashboards. They are left unchanged.

  This migration creates two new tables for personal, booking-independent
  direct messages initiated from the admin Messages panel:

  1. customer_direct_messages
     - One conversation thread per customer (keyed by customer_id)
     - sender_role: 'admin' | 'customer'
     - read_by_customer / read_by_admin flags

  2. business_direct_messages
     - One conversation thread per business (keyed by business_id)
     - sender_role: 'admin' | 'business'
     - read_by_business / read_by_admin flags

  Security (RLS enabled on both):
  - Customer/Business: can read and send messages in their own thread
  - Admin: can read and send messages in any thread; can update read flags
*/

-- ── customer_direct_messages ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_direct_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id      uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  admin_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role      text NOT NULL CHECK (sender_role IN ('admin', 'customer')),
  sender_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message          text NOT NULL,
  read_by_customer boolean NOT NULL DEFAULT false,
  read_by_admin    boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cdm_customer_id   ON customer_direct_messages(customer_id);
CREATE INDEX IF NOT EXISTS idx_cdm_created_at    ON customer_direct_messages(created_at DESC);

ALTER TABLE customer_direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer can view own direct messages"
  ON customer_direct_messages FOR SELECT
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Customer or admin can send direct messages"
  ON customer_direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      customer_id = auth.uid()
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Admin can update customer direct message read flags"
  ON customer_direct_messages FOR UPDATE
  TO authenticated
  USING (
    customer_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- ── business_direct_messages ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS business_direct_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id      uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  admin_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role      text NOT NULL CHECK (sender_role IN ('admin', 'business')),
  sender_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message          text NOT NULL,
  read_by_business boolean NOT NULL DEFAULT false,
  read_by_admin    boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bdm_business_id   ON business_direct_messages(business_id);
CREATE INDEX IF NOT EXISTS idx_bdm_created_at    ON business_direct_messages(created_at DESC);

ALTER TABLE business_direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Business can view own direct messages"
  ON business_direct_messages FOR SELECT
  TO authenticated
  USING (
    business_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Business or admin can send direct messages"
  ON business_direct_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      business_id = auth.uid()
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Admin or business can update direct message read flags"
  ON business_direct_messages FOR UPDATE
  TO authenticated
  USING (
    business_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
