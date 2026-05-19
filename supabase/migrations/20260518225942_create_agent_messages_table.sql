/*
  # Create agent_messages table

  Enables direct messaging between admin and agents, mirroring the
  admin_provider_messages table structure. Each agent has one continuous
  conversation thread with the admin.

  1. New Table: agent_messages
     - id (uuid, primary key)
     - agent_id (uuid, FK → agent_profiles, identifies the agent in the thread)
     - admin_id (uuid, FK → auth.users, identifies the admin in the thread)
     - sender_id (uuid, FK → auth.users, who actually sent this message)
     - message (text, the message content)
     - read (boolean, default false)
     - read_at (timestamptz, nullable)
     - created_at (timestamptz)

  2. Security
     - RLS enabled
     - Agent can read/insert messages in their own thread
     - Admin can read/insert messages in any thread
     - Both can update read status on their own thread
*/

CREATE TABLE IF NOT EXISTS agent_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id   uuid NOT NULL REFERENCES agent_profiles(id) ON DELETE CASCADE,
  admin_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message    text NOT NULL,
  read       boolean NOT NULL DEFAULT false,
  read_at    timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_agent_id  ON agent_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_admin_id  ON agent_messages(admin_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_created_at ON agent_messages(created_at DESC);

ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agent or admin can view their conversation"
  ON agent_messages FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid()
    OR agent_id = auth.uid()
    OR admin_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Agent or admin can send messages"
  ON agent_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      agent_id = auth.uid()
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    )
  );

CREATE POLICY "Agent or admin can update read status"
  ON agent_messages FOR UPDATE
  TO authenticated
  USING (
    agent_id = auth.uid()
    OR admin_id = auth.uid()
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
