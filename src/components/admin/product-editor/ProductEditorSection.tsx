import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductEditorSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ProductEditorSection({ title, description, children }: ProductEditorSectionProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-white/10 bg-card/80 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
      <CardHeader className="border-b border-white/8 p-5 sm:p-6">
        <CardTitle className="font-heading text-xl text-foreground">{title}</CardTitle>
        <CardDescription className="max-w-2xl leading-relaxed">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}
