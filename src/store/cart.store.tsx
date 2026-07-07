import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, ProductForCart } from "@/types/cart";
import { commerceConfig } from "@/config/commerce.config";
import { canPurchase } from "@/utils/inventory";

const STORAGE_KEY = commerceConfig.cartStorageKey;

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  total: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  addItem: (product: ProductForCart, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function loadInitialItems(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setItems(loadInitialItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((acc, it) => acc + it.price * it.quantity, 0);
    return {
      items,
      count: items.reduce((acc, it) => acc + it.quantity, 0),
      subtotal,
      total: subtotal,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      setDrawerOpen,
      addItem: (product, quantity = 1) => {
        if (!canPurchase(product, quantity)) return;
        setItems((prev) => {
          const existing = prev.find((it) => it.productId === product.id);
          if (existing) {
            return prev.map((it) =>
              it.productId === product.id ? { ...it, quantity: it.quantity + quantity } : it,
            );
          }
          return [
            ...prev,
            {
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: Number(product.price),
              currency: product.currency,
              image_url: product.image_url,
              image_url_thumb: product.image_url_thumb,
              image_url_card: product.image_url_card,
              image_url_detail: product.image_url_detail,
              short_description: product.short_description,
              category: product.category,
              availability: product.availability,
              stock_quantity: product.stock_quantity,
              track_inventory: product.track_inventory,
              allow_backorder: product.allow_backorder,
              low_stock_threshold: product.low_stock_threshold,
              out_of_stock_behavior: product.out_of_stock_behavior,
              payment_url: product.payment_url,
              payment_button_label: product.payment_button_label,
              quantity,
            },
          ];
        });
      },
      removeItem: (productId) =>
        setItems((prev) => prev.filter((it) => it.productId !== productId)),
      updateQuantity: (productId, quantity) =>
        setItems((prev) =>
          quantity <= 0
            ? prev.filter((it) => it.productId !== productId)
            : prev.map((it) => (it.productId === productId ? { ...it, quantity } : it)),
        ),
      clear: () => setItems([]),
    };
  }, [items, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
