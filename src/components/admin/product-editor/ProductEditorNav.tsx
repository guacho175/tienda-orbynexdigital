import {
  Boxes,
  CircleDollarSign,
  Image,
  Link2,
  PackageSearch,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import {
  PRODUCT_EDITOR_SECTIONS,
  type ProductEditorSectionId,
} from "@/config/product-editor.config";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const SECTION_ICONS: Record<ProductEditorSectionId, LucideIcon> = {
  general: SlidersHorizontal,
  inventory: Boxes,
  pricing: CircleDollarSign,
  media: Image,
  organization: PackageSearch,
  seo: Link2,
};

interface ProductEditorNavProps {
  activeSection: ProductEditorSectionId;
  errorCountBySection: Record<ProductEditorSectionId, number>;
  onChange: (section: ProductEditorSectionId) => void;
}

export function ProductEditorNav({
  activeSection,
  errorCountBySection,
  onChange,
}: ProductEditorNavProps) {
  return (
    <>
      <div className="lg:hidden">
        <label
          htmlFor="product-editor-section"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Sección del producto
        </label>
        <Select
          value={activeSection}
          onValueChange={(value) => onChange(value as ProductEditorSectionId)}
        >
          <SelectTrigger id="product-editor-section" className="h-12 rounded-xl bg-card/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_EDITOR_SECTIONS.map((section) => {
              const errorCount = errorCountBySection[section.id];
              return (
                <SelectItem key={section.id} value={section.id}>
                  {section.label}
                  {errorCount > 0 ? ` · ${errorCount} error${errorCount === 1 ? "" : "es"}` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <nav
        aria-label="Secciones del editor de producto"
        className="sticky top-24 hidden overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-[0_14px_42px_rgba(15,23,42,0.08)] lg:block"
      >
        <p className="px-3 pb-2 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Secciones
        </p>
        <div className="divide-y divide-slate-100">
          {PRODUCT_EDITOR_SECTIONS.map((section) => {
            const Icon = SECTION_ICONS[section.id];
            const errorCount = errorCountBySection[section.id];
            const isActive = activeSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onChange(section.id)}
                aria-current={isActive ? "step" : undefined}
                className={cn(
                  "relative flex min-h-14 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400",
                  isActive
                    ? "bg-sky-50 text-sky-600"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                )}
              >
                {isActive ? (
                  <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sky-500" />
                ) : null}
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{section.label}</span>
                  <span
                    className={cn(
                      "mt-0.5 block truncate text-[11px]",
                      isActive ? "text-sky-500" : "text-slate-500",
                    )}
                  >
                    {section.description}
                  </span>
                </span>
                {errorCount > 0 ? (
                  <span
                    className="inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[11px] font-bold text-destructive-foreground"
                    aria-label={`${errorCount} error${errorCount === 1 ? "" : "es"} en ${section.label}`}
                  >
                    {errorCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
