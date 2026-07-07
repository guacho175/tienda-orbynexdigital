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
  availability?: string;
  stock_quantity?: number;
  track_inventory?: boolean;
  allow_backorder?: boolean;
  low_stock_threshold?: number;
  out_of_stock_behavior?: "show_sold_out" | "hide_product";
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
  | "availability"
  | "stock_quantity"
  | "track_inventory"
  | "allow_backorder"
  | "low_stock_threshold"
  | "out_of_stock_behavior"
  | "payment_url"
  | "payment_button_label"
>;
