import { AlertCircle, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductEditorActionsBarProps {
  isDirty: boolean;
  submitting: boolean;
  uploadingImage: boolean;
  submitLabel: string;
  onCancel?: () => void;
}

export function ProductEditorActionsBar({
  isDirty,
  submitting,
  uploadingImage,
  submitLabel,
  onCancel,
}: ProductEditorActionsBarProps) {
  const busy = submitting || uploadingImage;

  return (
    <div className="sticky bottom-3 z-20 mt-4 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div
        className="flex min-h-6 items-center justify-center gap-2 text-sm sm:justify-start"
        aria-live="polite"
      >
        {busy ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin text-accent" aria-hidden="true" />
            <span className="text-muted-foreground">
              {uploadingImage ? "Procesando imagen…" : "Guardando cambios…"}
            </span>
          </>
        ) : isDirty ? (
          <>
            <AlertCircle className="h-4 w-4 text-amber-300" aria-hidden="true" />
            <span className="text-amber-700">Hay cambios sin guardar</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-accent" aria-hidden="true" />
            <span className="text-muted-foreground">Sin cambios pendientes</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" disabled={busy} className="btn-hero">
          {submitting ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </div>
  );
}
