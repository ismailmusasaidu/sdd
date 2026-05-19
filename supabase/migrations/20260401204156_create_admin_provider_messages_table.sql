/*
  # Create Admin-Provider Messages Table

  1. New Tables
    - `admin_provider_messages`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to auth.users)
      - `admin_id` (uuid, foreign key to auth.users)
      - `sender_id` (uuid, who sent the message)
      - `message` (text) - Message content
      - `read` (boolean) - Whether message has been read
      - `read_at` (timestamptz) - When message was read
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `admin_provider_messages`
    - Only provider and admin involved can see messages
    - Both can send and read their own messages
*/

CREATE TABLE IF NOT EXISTS admin_provider_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_provider_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON admin_provider_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    provider_id = auth.uid() OR
    admin_id = auth.uid()
  );

CREATE POLICY "Users can send messages"
  ON admin_provider_messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update read status of their messages"
  ON admin_provider_messages FOR UPDATE
  TO authenticated
  USING (
    provider_id = auth.uid() OR
    admin_id = auth.uid()
  )
  WITH CHECK (
    provider_id = auth.uid() OR
    admin_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_messages_provider_id ON admin_provider_messages(provider_id);
CREATE INDEX IF NOT EXISTS idx_messages_admin_id ON admin_provider_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON admin_provider_messages(created_at DESC);
