-- Product SEO metadata. Keeps existing products valid and relies on current
-- products RLS/grants; no new public table or checkout contract is introduced.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS meta_title TEXT,
  ADD COLUMN IF NOT EXISTS meta_description TEXT,
  ADD COLUMN IF NOT EXISTS seo_noindex BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS og_image_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_meta_title_length_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_meta_title_length_check
      CHECK (meta_title IS NULL OR char_length(meta_title) <= 70);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_meta_description_length_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_meta_description_length_check
      CHECK (meta_description IS NULL OR char_length(meta_description) <= 170);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_og_image_url_length_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_og_image_url_length_check
      CHECK (og_image_url IS NULL OR char_length(og_image_url) <= 500);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'products_og_image_url_http_check'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_og_image_url_http_check
      CHECK (og_image_url IS NULL OR og_image_url ~* '^https?://');
  END IF;
END $$;
