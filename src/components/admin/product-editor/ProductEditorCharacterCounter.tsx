interface ProductEditorCharacterCounterProps {
  value: string;
  max: number;
}

export function ProductEditorCharacterCounter({ value, max }: ProductEditorCharacterCounterProps) {
  return (
    <span className="text-xs tabular-nums text-muted-foreground">
      {value.length}/{max}
    </span>
  );
}
