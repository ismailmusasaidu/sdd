/*
  # Storage RLS policies for provider-documents bucket

  Allows authenticated providers to upload to their own folder,
  and allows public read access (bucket is public).

  1. Policies on storage.objects for bucket 'provider-documents':
    - INSERT: authenticated providers can upload to their own user-id folder
    - SELECT: public read (bucket is public)
    - DELETE: providers can delete their own files
*/

-- Providers can upload to their own folder (path starts with their user id)
CREATE POLICY "Providers can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'provider-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read (bucket is public, but belt-and-suspenders)
CREATE POLICY "Public can read provider documents"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'provider-documents');

-- Providers can delete their own files
CREATE POLICY "Providers can delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'provider-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
