/*
  # Add batch_id to service_bookings

  Customers can now submit multiple service types in one request.
  All rows from one submission share the same batch_id (UUID generated
  client-side). Solo bookings leave batch_id NULL for backward compatibility.

  1. Changes
    - `service_bookings`: add nullable `batch_id` uuid column
    - Index on batch_id for fast grouping queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_bookings' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE service_bookings ADD COLUMN batch_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS service_bookings_batch_id_idx ON service_bookings(batch_id);
