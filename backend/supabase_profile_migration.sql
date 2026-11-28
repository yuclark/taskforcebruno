-- ============================================================================
-- Task Force Bruno / Wildcat Welfare Portal — Editable Profile & Avatar Support
-- Idempotent migration (safe to re-run in Supabase SQL Editor)
-- ============================================================================

-- 1. Add safe editable personal info columns & avatar URL to public.profiles
--    Important institutional credentials (id, email, custom_id, role) remain locked
--    and are strictly protected by the Django backend API.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_number text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- 2. Create public-read avatars bucket with 5 MB limit & strict image MIME allowlist
--    Uploads go exclusively through the authenticated Django backend (service_role).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public read from avatars bucket" ON storage.objects;
CREATE POLICY "Allow public read from avatars bucket"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'avatars');
