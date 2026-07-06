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
  is_active: boolean;
  availability: string;
  payment_url: string | null;
  payment_button_label: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}