import { brandConfig } from "@/config/brand.config";

export type ProductSeoSource = {
  name?: string | null;
  slug?: string | null;
  short_description?: string | null;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  seo_noindex?: boolean | null;
  og_image_url?: string | null;
  image_url?: string | null;
  image_url_card?: string | null;
  image_url_detail?: string | null;
};

export type ProductSeoMetadata = {
  title: string;
  description: string;
  path: string;
  robots?: string;
  image: string;
};

function cleanText(value: string | null | undefined) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function clip(value: string, max: number) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}...`;
}

export function buildProductSeoMetadata(product: ProductSeoSource): ProductSeoMetadata {
  const title = clip(
    cleanText(product.meta_title) || cleanText(product.name) || brandConfig.name,
    70,
  );
  const description = clip(
    cleanText(product.meta_description) ||
      cleanText(product.short_description) ||
      cleanText(product.description) ||
      brandConfig.description,
    170,
  );
  const slug = cleanText(product.slug) || "producto";

  return {
    title,
    description,
    path: `/producto/${slug}`,
    robots: product.seo_noindex ? "noindex,nofollow" : undefined,
    image:
      cleanText(product.og_image_url) ||
      cleanText(product.image_url_detail) ||
      cleanText(product.image_url_card) ||
      cleanText(product.image_url) ||
      "/logo/logo_orbynex_horizontal_blanco_v2_trim.png",
  };
}
