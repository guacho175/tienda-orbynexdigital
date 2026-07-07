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
  stock_quantity: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  low_stock_threshold: number;
  out_of_stock_behavior: "show_sold_out" | "hide_product";
  payment_url: string | null;
  payment_button_label: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
  available_quantity?: number;
  temporarily_reserved?: boolean;
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
  | "availability"
  | "stock_quantity"
  | "track_inventory"
  | "allow_backorder"
  | "low_stock_threshold"
  | "out_of_stock_behavior"
  | "payment_url"
  | "payment_button_label"
  | "available_quantity"
  | "temporarily_reserved"
>;
