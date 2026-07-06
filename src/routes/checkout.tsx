import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CreditCard, ExternalLink, Loader2, MessageCircle, ShoppingBag } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { BackLink } from "@/components/ui/BackLink";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Price } from "@/components/ui-common/Price";
import { EmptyState } from "@/components/ui-common/EmptyState";
import { ProductImage } from "@/components/product/ProductImage";
import { useCart } from "@/store/cart.store";
import { buildWhatsappCheckoutUrl } from "@/utils/whatsapp";
import { commerceConfig } from "@/config/commerce.config";
import { brandConfig } from "@/config/brand.config";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [{ title: `Checkout - ${brandConfig.name}` }],
  }),
  component: CheckoutPage,
});

const customerSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  email: z.string().trim().email("Email invalido").max(160),
  phone: z.string().trim().min(6, "Ingresa un telefono valido").max(40),
  comment: z.string().trim().max(500).optional(),
});

type FlowPaymentResponse = {
  redirectUrl?: string;
  error?: string;
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCart();
  const [form, setForm] = useState({ name: "", email: "", phone: "", comment: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [flowError, setFlowError] = useState<string | null>(null);
  const [isCreatingFlowPayment, setIsCreatingFlowPayment] = useState(false);

  if (items.length === 0) {
    return (
      <>
        <PageHeader
          title="Finalizar compra"
          subtitle="Necesitas servicios en el carrito antes de iniciar el pago."
        />
        <Container className="py-8 sm:py-12">
          <BackLink to="/carrito" label="Volver al carrito" />
          <div className="mt-8">
            <EmptyState
              icon={<ShoppingBag className="h-10 w-10" />}
              title="No hay servicios en tu carrito"
              description="Vuelve al catalogo, agrega servicios y regresa para elegir como confirmar tu pedido."
              action={
                <Button asChild className="btn-hero">
                  <Link to="/catalogo">Ir al catalogo</Link>
                </Button>
              }
            />
          </div>
        </Container>
      </>
    );
  }

  const singleItemWithLink = items.length === 1 && items[0].payment_url ? items[0] : null;

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

  async function handleFlowPayment() {
    setFlowError(null);
    const parsed = validate();
    if (!parsed) return;

    setIsCreatingFlowPayment(true);

    try {
      const response = await fetch("/api/flow/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          customer: {
            name: parsed.name,
            email: parsed.email,
            phone: parsed.phone,
            comment: parsed.comment || undefined,
          },
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as FlowPaymentResponse;

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo crear el pago online");
      }

      if (!payload.redirectUrl) {
        throw new Error("El proveedor de pago no devolvio una URL valida");
      }

      window.location.assign(payload.redirectUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear el pago online";
      setFlowError(message);
      toast.error("No se pudo iniciar el pago", {
        description: message,
      });
      setIsCreatingFlowPayment(false);
    }
  }

  function handleExternalPayment() {
    if (!singleItemWithLink?.payment_url) return;
    window.open(singleItemWithLink.payment_url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <PageHeader
        title="Finalizar compra"
        subtitle="Completa tus datos y elige pago online, WhatsApp o pago externo cuando este disponible."
      />
      <Container className="py-8 sm:py-12">
        <BackLink to="/carrito" label="Volver al carrito" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="card-surface p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-foreground">Datos de contacto</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Usamos esta informacion para crear el pago o preparar el mensaje de WhatsApp.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Tu nombre"
                />
                {errors.name ? (
                  <p className="mt-1 text-xs text-destructive">{errors.name}</p>
                ) : null}
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
                  {errors.email ? (
                    <p className="mt-1 text-xs text-destructive">{errors.email}</p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="phone">Telefono / WhatsApp</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+56 9 ..."
                  />
                  {errors.phone ? (
                    <p className="mt-1 text-xs text-destructive">{errors.phone}</p>
                  ) : null}
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

            <div className="mt-8 space-y-4 border-t border-border/50 pt-6">
              <div>
                <h3 className="text-base font-semibold text-foreground">Opciones de pago</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  El pago online procesa el carrito completo. WhatsApp queda como alternativa de
                  coordinacion.
                </p>
              </div>

              {commerceConfig.flowCheckout.enabled ? (
                <>
                  <Button
                    onClick={handleFlowPayment}
                    size="lg"
                    className="btn-hero h-auto min-h-10 w-full py-3"
                    disabled={isCreatingFlowPayment}
                  >
                    {isCreatingFlowPayment ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="mr-1 h-4 w-4" />
                    )}
                    <span className="flex flex-col items-center gap-1">
                      <span>
                        {isCreatingFlowPayment
                          ? "Creando pago..."
                          : commerceConfig.flowCheckout.label}
                      </span>
                      <Price
                        value={total}
                        className="text-xs font-semibold text-primary-foreground/90"
                      />
                    </span>
                  </Button>
                  {flowError ? (
                    <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                      {flowError}
                    </p>
                  ) : null}
                </>
              ) : null}

              <Button
                onClick={handleWhatsapp}
                size="lg"
                variant={commerceConfig.flowCheckout.enabled ? "outline" : "default"}
                className={commerceConfig.flowCheckout.enabled ? "w-full" : "btn-hero w-full"}
                disabled={isCreatingFlowPayment}
              >
                <MessageCircle className="mr-1 h-4 w-4" />
                Enviar pedido por WhatsApp
              </Button>

              {singleItemWithLink ? (
                <Button
                  onClick={handleExternalPayment}
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={isCreatingFlowPayment}
                >
                  <ExternalLink className="mr-1 h-4 w-4" />
                  {singleItemWithLink.payment_button_label ?? "Pagar con link externo"}
                </Button>
              ) : items.some((i) => i.payment_url) ? (
                <p className="rounded-md border border-border/60 bg-secondary/40 p-3 text-sm text-muted-foreground">
                  Los links externos quedan disponibles por producto individual. Para este carrito
                  completo usa pago online o WhatsApp.
                </p>
              ) : null}

              <p className="text-xs text-muted-foreground">{commerceConfig.legal.termsShort}</p>
            </div>
          </div>

          <aside className="card-surface h-fit p-6">
            <h3 className="text-lg font-semibold text-foreground">Resumen del pedido</h3>
            <ul className="mt-4 space-y-4 text-sm">
              {items.map((it) => (
                <li key={it.productId} className="grid grid-cols-[3.5rem_1fr] gap-3">
                  <ProductImage
                    src={it.image_url}
                    thumbSrc={it.image_url_thumb}
                    cardSrc={it.image_url_card}
                    detailSrc={it.image_url_detail}
                    alt={`Imagen de ${it.name}`}
                    variant="thumb"
                    sizes="3.5rem"
                    className="aspect-square rounded-md"
                    iconClassName="h-5 w-5"
                  />
                  <div className="min-w-0">
                    <div className="flex justify-between gap-3">
                      <span className="line-clamp-2 text-muted-foreground">
                        {it.name} <span className="text-foreground/70">x{it.quantity}</span>
                      </span>
                      <Price value={it.price * it.quantity} currency={it.currency} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex justify-between border-t border-border/50 pt-4 text-base font-semibold">
              <span>Total</span>
              <Price value={total} className="text-2xl text-accent" />
            </div>
            <Button asChild variant="outline" className="mt-5 w-full">
              <Link to="/catalogo">Seguir comprando</Link>
            </Button>
          </aside>
        </div>
      </Container>
    </>
  );
}
