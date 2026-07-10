import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProductEditorSectionProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ProductEditorSection({ title, description, children }: ProductEditorSectionProps) {
  return (
    <Card className="overflow-hidden rounded-xl border-slate-200 bg-white text-slate-950 shadow-sm [&_input]:border-slate-200 [&_input]:bg-white [&_textarea]:border-slate-200 [&_textarea]:bg-white">
      <CardHeader className="border-b border-slate-200 p-4">
        <CardTitle className="font-heading text-lg text-slate-950">{title}</CardTitle>
        <CardDescription className="max-w-2xl text-sm leading-5 text-slate-600">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">{children}</CardContent>
    </Card>
  );
}
