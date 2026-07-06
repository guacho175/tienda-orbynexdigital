export interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number;
  currency: string;
  category: string | null;
  image_url: string | null;
  image_url_thumb: string | null;
  image_url_card: string | null;
  image_url_detail: string | null;
  is_active: boolean;
  availability: string;
  payment_url: string | null;
  payment_button_label: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type ProductCardData = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "short_description"
  | "price"
  | "currency"
  | "category"
  | "image_url"
  | "image_url_thumb"
  | "image_url_card"
  | "image_url_detail"
  | "payment_url"
  | "payment_button_label"
>;
