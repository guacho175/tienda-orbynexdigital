import type { Product } from "./product";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
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
  | "payment_url"
  | "payment_button_label"
>;