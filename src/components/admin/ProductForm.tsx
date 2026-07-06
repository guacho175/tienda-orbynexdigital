import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { commerceConfig } from "@/config/commerce.config";
import type { Product } from "@/types/product";
import type { ProductInput } from "@/services/products.service";

const schema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "El slug es obligatorio")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  short_description: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  price: z.coerce.number().min(0, "El precio no puede ser negativo"),
  currency: z.string().trim().min(3).max(6),
  category: z.string().trim().max(60).optional().or(z.literal("")),
  image_url: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  is_active: z.boolean(),
  availability: z.enum(["in_stock", "out_of_stock", "on_demand"]),
  payment_url: z
    .string()
    .trim()
    .url("URL inválida")
    .max(500)
    .optional()
    .or(z.literal("")),
  payment_button_label: z.string().trim().max(60).optional().or(z.literal("")),
  display_order: z.coerce.number().int().min(0).default(0),
});

function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export interface ProductFormProps {
  initial?: Product | null;
  submitLabel?: string;
  onSubmit: (values: ProductInput) => Promise<void>;
  onCancel?: () => void;
}

export function ProductForm({ initial, submitLabel = "Guardar", onSubmit, onCancel }: ProductFormProps) {
  const [values, setValues] = useState<ProductInput>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    short_description: initial?.short_description ?? "",
    description: initial?.description ?? "",
    price: initial?.price ?? 0,
    currency: initial?.currency ?? commerceConfig.currency,
    category: initial?.category ?? "",
    image_url: initial?.image_url ?? "",
    is_active: initial?.is_active ?? true,
    availability: (initial?.availability as ProductInput["availability"]) ?? "in_stock",
    payment_url: initial?.payment_url ?? "",
    payment_button_label: initial?.payment_button_label ?? "",
    display_order: initial?.display_order ?? 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors({});
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        flat[issue.path.join(".")] = issue.message;
      }
      setErrors(flat);
      return;
    }
    setSubmitting(true);
    try {
      const clean: ProductInput = {
        ...parsed.data,
        short_description: parsed.data.short_description || null,
        description: parsed.data.description || null,
        category: parsed.data.category || null,
        image_url: parsed.data.image_url || null,
        payment_url: parsed.data.payment_url || null,
        payment_button_label: parsed.data.payment_button_label || null,
      } as ProductInput;
      await onSubmit(clean);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface space-y-6 p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => {
              const v = e.target.value;
              update("name", v);
              if (!initial && !values.slug) update("slug", slugify(v));
            }}
          />
          {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={values.slug}
            onChange={(e) => update("slug", slugify(e.target.value))}
          />
          {errors.slug ? <p className="text-xs text-destructive">{errors.slug}</p> : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_description">Descripción corta</Label>
        <Input
          id="short_description"
          value={values.short_description ?? ""}
          onChange={(e) => update("short_description", e.target.value)}
          maxLength={200}
        />
        {errors.short_description ? (
          <p className="text-xs text-destructive">{errors.short_description}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción completa</Label>
        <Textarea
          id="description"
          rows={5}
          value={values.description ?? ""}
          onChange={(e) => update("description", e.target.value)}
          maxLength={4000}
        />
        {errors.description ? (
          <p className="text-xs text-destructive">{errors.description}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="price">Precio *</Label>
          <Input
            id="price"
            type="number"
            min={0}
            step="1"
            value={values.price}
            onChange={(e) => update("price", Number(e.target.value))}
          />
          {errors.price ? <p className="text-xs text-destructive">{errors.price}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="currency">Moneda</Label>
          <Input
            id="currency"
            value={values.currency}
            onChange={(e) => update("currency", e.target.value.toUpperCase())}
            maxLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="display_order">Orden</Label>
          <Input
            id="display_order"
            type="number"
            min={0}
            value={values.display_order}
            onChange={(e) => update("display_order", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            value={values.category ?? ""}
            onChange={(e) => update("category", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="availability">Disponibilidad</Label>
          <select
            id="availability"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={values.availability}
            onChange={(e) => update("availability", e.target.value as ProductInput["availability"])}
          >
            <option value="in_stock">En stock</option>
            <option value="out_of_stock">Agotado</option>
            <option value="on_demand">Bajo pedido</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="image_url">URL de imagen</Label>
        <Input
          id="image_url"
          value={values.image_url ?? ""}
          onChange={(e) => update("image_url", e.target.value)}
          placeholder="https://..."
        />
        {errors.image_url ? <p className="text-xs text-destructive">{errors.image_url}</p> : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment_url">URL de pago externo</Label>
          <Input
            id="payment_url"
            value={values.payment_url ?? ""}
            onChange={(e) => update("payment_url", e.target.value)}
            placeholder="https://flow.cl/... o Mercado Pago"
          />
          {errors.payment_url ? (
            <p className="text-xs text-destructive">{errors.payment_url}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="payment_button_label">Texto del botón de pago</Label>
          <Input
            id="payment_button_label"
            value={values.payment_button_label ?? ""}
            onChange={(e) => update("payment_button_label", e.target.value)}
            placeholder="Pagar ahora"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-md border border-border/50 bg-secondary/20 p-4">
        <Switch
          id="is_active"
          checked={values.is_active}
          onCheckedChange={(v) => update("is_active", v)}
        />
        <Label htmlFor="is_active" className="cursor-pointer">
          Producto activo (visible en la tienda)
        </Label>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting} className="btn-hero">
          {submitting ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}