/*
  # Make admin_id nullable in customer_direct_messages and business_direct_messages

  When a customer or business initiates a conversation, they don't yet know
  which admin will reply. The admin_id is only populated after the admin responds.
  Making it nullable allows the initial message from the user side to be inserted.
*/

ALTER TABLE customer_direct_messages ALTER COLUMN admin_id DROP NOT NULL;
ALTER TABLE business_direct_messages ALTER COLUMN admin_id DROP NOT NULL;
