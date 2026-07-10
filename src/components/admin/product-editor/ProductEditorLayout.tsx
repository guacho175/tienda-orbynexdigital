import type { ReactNode } from "react";

interface ProductEditorLayoutProps {
  navigation: ReactNode;
  children: ReactNode;
}

export function ProductEditorLayout({ navigation, children }: ProductEditorLayoutProps) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-[208px_minmax(0,1fr)]">
      {navigation}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
