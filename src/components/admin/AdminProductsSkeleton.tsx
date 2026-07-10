function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 motion-reduce:animate-none ${className}`}
    />
  );
}

export function AdminProductsSkeleton() {
  return (
    <>
      <div className="space-y-4 md:hidden" aria-label="Cargando productos" aria-busy="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-[4.5rem_1fr] gap-4">
              <SkeletonBlock className="aspect-square rounded-xl" />
              <div className="min-w-0 space-y-3">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-3 w-1/2" />
                <SkeletonBlock className="h-4 w-24" />
                <div className="flex items-center justify-between gap-3">
                  <SkeletonBlock className="h-6 w-28" />
                  <SkeletonBlock className="h-9 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm md:block"
        aria-label="Cargando productos"
        aria-busy="true"
      >
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-slate-200 bg-white text-left text-xs uppercase tracking-wider text-slate-600">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="border-t border-border/50">
                <td className="px-4 py-3">
                  <div className="grid grid-cols-[3.75rem_1fr] items-center gap-3">
                    <SkeletonBlock className="aspect-square rounded-xl" />
                    <div className="min-w-0 space-y-2">
                      <SkeletonBlock className="h-4 w-40" />
                      <SkeletonBlock className="h-3 w-28" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <SkeletonBlock className="h-4 w-24" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBlock className="h-4 w-20" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBlock className="h-6 w-28" />
                </td>
                <td className="px-4 py-3">
                  <SkeletonBlock className="h-6 w-24" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <SkeletonBlock className="h-8 w-8" />
                    <SkeletonBlock className="h-8 w-8" />
                    <SkeletonBlock className="h-8 w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
