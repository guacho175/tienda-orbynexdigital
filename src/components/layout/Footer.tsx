import { Link } from "@tanstack/react-router";
import { Instagram, Mail, Phone } from "lucide-react";
import { FooterRain } from "@/components/brand/BrandEffects";
import { brandConfig } from "@/config/brand.config";
import { navigationConfig } from "@/config/navigation.config";
import { Container } from "./Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden border-t border-white/8 bg-[linear-gradient(180deg,oklch(0.16_0.035_255/0.94),oklch(0.12_0.03_255/0.98))] py-12 sm:py-14">
      <FooterRain />
      <Container>
        <div className="footer-top grid gap-10 text-center md:grid-cols-[1.25fr_0.8fr_1fr] md:text-left">
          <div className="mx-auto md:mx-0">
            <div className="flex items-center justify-center gap-2 md:justify-start">
              <img
                src={brandConfig.logoUrl}
                alt={brandConfig.name}
                className="h-12 w-auto max-w-[220px] object-contain"
                width={291}
                height={80}
              />
            </div>
            <p className="mx-auto mt-3 max-w-xs text-sm text-muted-foreground md:mx-0">
              Tienda online para publicar servicios digitales, recibir pedidos y atender clientes
              con una experiencia clara.
            </p>
          </div>

          <div>
            <h4 className="eyebrow-tech text-sm font-semibold uppercase tracking-wider text-foreground">
              Navegacion
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {navigationConfig.footer.links.map((l) => (
                <li key={l.href}>
                  <Link
                    to={l.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="eyebrow-tech text-sm font-semibold uppercase tracking-wider text-foreground">
              Contacto
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${brandConfig.email}`} className="hover:text-foreground">
                  {brandConfig.email}
                </a>
              </li>
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <Phone className="h-4 w-4" />
                <a
                  href={`tel:${brandConfig.phone.replace(/\s/g, "")}`}
                  className="hover:text-foreground"
                >
                  {brandConfig.phone}
                </a>
              </li>
              <li className="flex items-center justify-center gap-2 md:justify-start">
                <Instagram className="h-4 w-4" />
                <a
                  href={brandConfig.instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground"
                >
                  {brandConfig.instagram}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom mt-10 border-t border-white/8 pt-6 text-center text-xs text-muted-foreground">
          {year} {brandConfig.name}. Todos los derechos reservados.
        </div>
      </Container>
    </footer>
  );
}
