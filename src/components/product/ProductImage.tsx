import { useEffect, useState } from "react";
import { ImageOff, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
  iconClassName?: string;
  loading?: "eager" | "lazy";
}

export function ProductImage({
  src,
  alt,
  className,
  imageClassName,
  placeholderClassName,
  iconClassName,
  loading = "lazy",
}: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const hasImage = Boolean(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={cn("overflow-hidden bg-secondary/40", className)}>
      {hasImage ? (
        <img
          src={src ?? ""}
          alt={alt}
          loading={loading}
          onError={() => setFailed(true)}
          className={cn("h-full w-full object-cover", imageClassName)}
        />
      ) : (
        <div
          className={cn(
            "flex h-full w-full items-center justify-center text-muted-foreground/50",
            placeholderClassName,
          )}
          aria-label={src ? "Imagen no disponible" : "Producto sin imagen"}
          role="img"
        >
          {src ? (
            <ImageOff className={cn("h-12 w-12", iconClassName)} />
          ) : (
            <Package className={cn("h-12 w-12", iconClassName)} />
          )}
        </div>
      )}
    </div>
  );
}
