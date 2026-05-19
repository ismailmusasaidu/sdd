/*
  # Create business_messages table

  Enables real-time messaging between admin and businesses, tied to individual
  business_bookings rows (including multi-service batch items).

  1. New Table: `business_messages`
    - `id` (uuid, primary key)
    - `booking_id` (uuid, FK → business_bookings ON DELETE CASCADE)
    - `sender_role` (text, CHECK: 'admin' | 'business')
    - `sender_id` (uuid, FK → auth.users)
    - `message` (text, not null)
    - `read_by_business` (boolean, default false)
    - `read_by_admin` (boolean, default false)
    - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS
    - SELECT: business can read messages on their own bookings; admin can read all
    - INSERT: business can insert on own bookings; admin can insert on any
    - UPDATE: admin can update (mark read); business can update read status on own

  3. Index on booking_id for fast message lookups
*/

CREATE TABLE IF NOT EXISTS business_messages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id       uuid NOT NULL REFERENCES business_bookings(id) ON DELETE CASCADE,
  sender_role      text NOT NULL CHECK (sender_role IN ('admin', 'business')),
  sender_id        uuid NOT NULL REFERENCES auth.users(id),
  message          text NOT NULL,
  read_by_business boolean NOT NULL DEFAULT false,
  read_by_admin    boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS business_messages_booking_id_idx ON business_messages(booking_id);

ALTER TABLE business_messages ENABLE ROW LEVEL SECURITY;

-- Business: read messages on their own bookings; admin reads all
CREATE POLICY "Business can read messages on own bookings"
  ON business_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_bookings
      WHERE business_bookings.id = business_messages.booking_id
        AND business_bookings.business_id = auth.uid()
    )
    OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  );

-- Business and admin can insert messages
CREATE POLICY "Business and admin can send messages"
  ON business_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM business_bookings
        WHERE business_bookings.id = booking_id
          AND business_bookings.business_id = auth.uid()
      )
      OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
    )
  );

-- Admin: update any message (mark read, etc.)
CREATE POLICY "Admin can update business messages"
  ON business_messages FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Business: update read status on messages for their own bookings
CREATE POLICY "Business can update read status on own messages"
  ON business_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM business_bookings
      WHERE business_bookings.id = business_messages.booking_id
        AND business_bookings.business_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_bookings
      WHERE business_bookings.id = business_messages.booking_id
        AND business_bookings.business_id = auth.uid()
    )
  );
