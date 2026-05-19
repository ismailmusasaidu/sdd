/*
  # Customer Messaging & Booking Provider Info

  ## Changes

  ### 1. service_bookings — add provider info columns
  - `assigned_provider_name` (text) — name of assigned provider
  - `assigned_provider_phone` (text) — phone of assigned provider
  - `assigned_provider_email` (text) — email of assigned provider
  - `admin_notes` (text) — internal notes admin can attach

  ### 2. New table: customer_messages
  A thread-per-booking messaging system between admin and customer.
  - `id` (uuid, primary key)
  - `booking_id` (uuid, references service_bookings)
  - `sender_role` (text) — 'admin' or 'customer'
  - `sender_id` (uuid, references auth.users)
  - `message` (text)
  - `read_by_customer` (boolean, default false)
  - `read_by_admin` (boolean, default false)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on customer_messages
  - Customers can read/insert messages for bookings they own
  - Admins can read/insert all messages
*/

-- Add provider info to service_bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_bookings' AND column_name='assigned_provider_name') THEN
    ALTER TABLE service_bookings ADD COLUMN assigned_provider_name text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_bookings' AND column_name='assigned_provider_phone') THEN
    ALTER TABLE service_bookings ADD COLUMN assigned_provider_phone text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_bookings' AND column_name='assigned_provider_email') THEN
    ALTER TABLE service_bookings ADD COLUMN assigned_provider_email text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='service_bookings' AND column_name='admin_notes') THEN
    ALTER TABLE service_bookings ADD COLUMN admin_notes text DEFAULT '';
  END IF;
END $$;

-- Customer messages table
CREATE TABLE IF NOT EXISTS customer_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'customer')),
  sender_id uuid NOT NULL REFERENCES auth.users(id),
  message text NOT NULL,
  read_by_customer boolean NOT NULL DEFAULT false,
  read_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE customer_messages ENABLE ROW LEVEL SECURITY;

-- Customers can read messages on their own bookings
CREATE POLICY "Customers can read messages on own bookings"
  ON customer_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_bookings
      WHERE service_bookings.id = customer_messages.booking_id
        AND service_bookings.customer_id = auth.uid()
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Customers can insert messages on their own bookings
CREATE POLICY "Customers can send messages on own bookings"
  ON customer_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM service_bookings
        WHERE service_bookings.id = booking_id
          AND service_bookings.customer_id = auth.uid()
      )
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

-- Admins can update messages (mark read)
CREATE POLICY "Admins can update messages"
  ON customer_messages FOR UPDATE
  TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Customers can mark their messages as read
CREATE POLICY "Customers can update read status on own booking messages"
  ON customer_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM service_bookings
      WHERE service_bookings.id = customer_messages.booking_id
        AND service_bookings.customer_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM service_bookings
      WHERE service_bookings.id = customer_messages.booking_id
        AND service_bookings.customer_id = auth.uid()
    )
  );

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS customer_messages_booking_id_idx ON customer_messages(booking_id);
