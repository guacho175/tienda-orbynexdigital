import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ExternalLink, MessageCircle, ShoppingBag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Price } from "@/components/ui-common/Price";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { useCart } from "@/store/cart.store";
import { buildWhatsappCheckoutUrl } from "@/utils/whatsapp";
import { commerceConfig } from "@/config/commerce.config";
import { brandConfig } from "@/config/brand.config";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: `Checkout — ${brandConfig.name}` }],
  }),
  component: CheckoutPage,
});

const customerSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  email: z.string().trim().email("Email inválido").max(160),
  phone: z.string().trim().min(6, "Ingresa un teléfono válido").max(40),
  comment: z.string().trim().max(500).optional(),
});

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", comment: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (items.length === 0) {
    return (
      <>
        <PageHeader title="Checkout" />
        <Container className="py-12">
          <EmptyState
            icon={<ShoppingBag className="h-10 w-10" />}
            title="No hay productos en tu carrito"
            action={
              <Button asChild className="btn-hero">
                <Link to="/catalogo">Ir al catálogo</Link>
              </Button>
            }
          />
        </Container>
      </>
    );
  }

  const singleItemWithLink =
    items.length === 1 && items[0].payment_url ? items[0] : null;

  function validate() {
    const result = customerSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[issue.path.join(".")] = issue.message;
      }
      setErrors(fieldErrors);
      return null;
    }
    setErrors({});
    return result.data;
  }

  function handleWhatsapp() {
    const parsed = validate();
    if (!parsed) return;
    const url = buildWhatsappCheckoutUrl(
      items,
      parsed,
      total,
      commerceConfig.currency,
      commerceConfig.locale,
    );
    window.open(url, "_blank", "noopener,noreferrer");
    toast.success("Pedido enviado por WhatsApp", {
      description: "En breve te confirmamos los detalles.",
    });
    clear();
    navigate({ to: "/" });
  }

  function handleExternalPayment() {
    if (!singleItemWithLink?.payment_url) return;
    window.open(singleItemWithLink.payment_url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <PageHeader
        title="Finalizar compra"
        subtitle="Coordinamos por WhatsApp o abre el link de pago externo si el servicio lo tiene disponible."
      />
      <Container className="grid gap-8 py-12 lg:grid-cols-[1fr_380px]">
        <div className="card-surface p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Tus datos</h2>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tu nombre"
              />
              {errors.name ? <p className="mt-1 text-xs text-destructive">{errors.name}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tu@email.com"
                />
                {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email}</p> : null}
              </div>
              <div>
                <Label htmlFor="phone">Teléfono / WhatsApp</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+56 9 ..."
                />
                {errors.phone ? <p className="mt-1 text-xs text-destructive">{errors.phone}</p> : null}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comentario (opcional)</Label>
              <Textarea
                id="comment"
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                placeholder="Cuéntanos brevemente sobre tu proyecto"
                rows={4}
              />
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <Button onClick={handleWhatsapp} size="lg" className="btn-hero w-full">
              <MessageCircle className="mr-1 h-4 w-4" />
              Enviar pedido por WhatsApp
            </Button>

            {singleItemWithLink ? (
              <Button
                onClick={handleExternalPayment}
                variant="outline"
                size="lg"
                className="w-full"
              >
                <ExternalLink className="mr-1 h-4 w-4" />
                {singleItemWithLink.payment_button_label ?? "Pagar con link externo"}
              </Button>
            ) : items.some((i) => i.payment_url) ? (
              <p className="rounded-md border border-border/60 bg-secondary/40 p-3 text-sm text-muted-foreground">
                Para pedidos con varios productos, finaliza la compra por WhatsApp para coordinar el pago.
              </p>
            ) : null}

            <p className="text-xs text-muted-foreground">{commerceConfig.legal.termsShort}</p>
          </div>
        </div>

        <aside className="card-surface h-fit p-6">
          <h3 className="text-lg font-semibold text-foreground">Resumen</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((it) => (
              <li key={it.productId} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {it.name} <span className="text-foreground/70">x{it.quantity}</span>
                </span>
                <Price value={it.price * it.quantity} currency={it.currency} />
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border/50 pt-3 text-base font-semibold">
            <span>Total</span>
            <Price value={total} className="text-lg" />
          </div>
        </aside>
      </Container>
    </>
  );
}