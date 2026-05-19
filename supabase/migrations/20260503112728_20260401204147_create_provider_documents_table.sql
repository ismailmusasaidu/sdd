/*
  # Create Provider Documents Table

  1. New Tables
    - `provider_documents`
      - `id` (uuid, primary key)
      - `provider_id` (uuid, foreign key to auth.users)
      - `document_type` (text) - Type of document (id_card, certificate, license, etc.)
      - `file_url` (text) - URL to uploaded document
      - `file_name` (text) - Original file name
      - `verified` (boolean) - Admin verification status
      - `verified_at` (timestamptz) - When admin verified
      - `verified_by` (uuid) - Admin user who verified
      - `rejection_reason` (text) - Reason if document was rejected
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `provider_documents`
    - Providers can only see and upload their own documents
    - Admins can view and verify documents
*/

CREATE TABLE IF NOT EXISTS provider_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  verified boolean DEFAULT false,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id),
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own documents"
  ON provider_documents FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can upload documents"
  ON provider_documents FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Admins can view all documents"
  ON provider_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update document verification"
  ON provider_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND raw_app_meta_data->>'role' = 'admin'
    )
  );
