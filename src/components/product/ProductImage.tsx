import { useEffect, useState } from "react";
import { ImageOff, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  thumbSrc?: string | null;
  cardSrc?: string | null;
  detailSrc?: string | null;
  alt: string;
  variant?: "thumb" | "card" | "detail";
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  iconClassName?: string;
  loading?: "eager" | "lazy";
  sizes?: string;
  priority?: boolean;
}

export function ProductImage({
  src,
  thumbSrc,
  cardSrc,
  detailSrc,
  alt,
  variant = "card",
  className,
  imageClassName,
  placeholderClassName,
  iconClassName,
  loading = "lazy",
  sizes,
  priority = false,
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const selectedSrc =
    variant === "thumb"
      ? (thumbSrc ?? cardSrc ?? detailSrc ?? src)
      : variant === "detail"
        ? (detailSrc ?? cardSrc ?? src)
        : (cardSrc ?? detailSrc ?? src);
  const hasImage = Boolean(selectedSrc) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [selectedSrc]);

  return (
    <div className={cn("aspect-[4/3] overflow-hidden bg-secondary/40", className)}>
      {hasImage ? (
        <img
          src={selectedSrc ?? ""}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          sizes={sizes}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-muted-foreground/50",
            placeholderClassName,
          )}
          aria-label={selectedSrc ? "Imagen no disponible" : "Producto sin imagen"}
          role="img"
        >
          {selectedSrc ? (
            <ImageOff className={cn("h-12 w-12", iconClassName)} />
          ) : (
            <Package className={cn("h-12 w-12", iconClassName)} />
          )}
        </div>
      )}
    </div>
  );
}
