-- Add nullable image variant URLs. Keep image_url as legacy fallback/detail alias.
-- Existing products continue working until their images are re-uploaded from admin.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_url_thumb TEXT,
  ADD COLUMN IF NOT EXISTS image_url_card TEXT,
  ADD COLUMN IF NOT EXISTS image_url_detail TEXT;
