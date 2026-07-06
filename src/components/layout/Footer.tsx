import { Link } from "@tanstack/react-router";
import { Mail, Phone, Instagram } from "lucide-react";
import { brandConfig } from "@/config/brand.config";
import { navigationConfig } from "@/config/navigation.config";
import { Container } from "./Container";
import { buildWhatsappContactUrl } from "@/utils/whatsapp";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border/50 bg-background/60 py-12">
      <Container>
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-[image:var(--gradient-primary)]" />
              <span className="text-lg font-bold text-foreground">{brandConfig.name}</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">{brandConfig.description}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Navegación
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {navigationConfig.footer.links.map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-muted-foreground hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Contacto
            </h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <a href={`mailto:${brandConfig.email}`} className="hover:text-foreground">
                  {brandConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <a
                  href={buildWhatsappContactUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground"
                >
                  {brandConfig.phone}
                </a>
              </li>
              <li className="flex items-center gap-2">
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

        <div className="mt-10 border-t border-border/50 pt-6 text-center text-xs text-muted-foreground">
          © {year} {brandConfig.name}. Todos los derechos reservados.
        </div>
      </Container>
    </footer>
  );
}