import type { Product } from "./product";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  image_url_thumb?: string | null;
  image_url_card?: string | null;
  image_url_detail?: string | null;
  short_description?: string | null;
  category?: string | null;
  payment_url: string | null;
  payment_button_label: string | null;
  quantity: number;
}

export type ProductForCart = Pick<
  Product,
  | "id"
  | "slug"
  | "name"
  | "price"
  | "currency"
  | "image_url"
  | "image_url_thumb"
  | "image_url_card"
  | "image_url_detail"
  | "short_description"
  | "category"
  | "payment_url"
  | "payment_button_label"
>;
