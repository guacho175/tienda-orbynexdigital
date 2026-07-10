import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductEditorSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ProductEditorSection({ title, description, children }: ProductEditorSectionProps) {
  return (
    <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white text-slate-950 shadow-[0_18px_60px_rgba(15,23,42,0.08)] [&_input]:border-slate-200 [&_input]:bg-white [&_textarea]:border-slate-200 [&_textarea]:bg-white">
      <CardHeader className="border-b border-slate-200 p-5 sm:p-6">
        <CardTitle className="font-heading text-xl text-slate-950">{title}</CardTitle>
        <CardDescription className="max-w-2xl leading-relaxed text-slate-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}
