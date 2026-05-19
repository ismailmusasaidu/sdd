/*
  # Add batch_id to agent_bookings

  Agents can now submit multiple service types for a single client in one
  go. All rows from one submission share the same batch_id (UUID generated
  client-side at submit time).

  1. Changes
    - `agent_bookings`: add nullable `batch_id` uuid column
    - Index on batch_id for fast grouping queries
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_bookings' AND column_name = 'batch_id'
  ) THEN
    ALTER TABLE agent_bookings ADD COLUMN batch_id uuid;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS agent_bookings_batch_id_idx ON agent_bookings(batch_id);
