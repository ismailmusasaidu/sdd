/*
  # Add batch_id to business_bookings

  Businesses can submit multiple service types in a single request.
  Each line item is stored as a separate row; all rows from one submission
  share the same batch_id (a UUID generated client-side at submit time).

  1. Changes
    - `business_bookings`: add nullable `batch_id` uuid column
    - Index on batch_id for fast grouping queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'business_bookings' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE business_bookings ADD COLUMN batch_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS business_bookings_batch_id_idx ON business_bookings(batch_id);
