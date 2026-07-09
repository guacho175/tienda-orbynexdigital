import type { ProductEditorValues } from "./product-editor.schema";

export type ProductEditorErrors = Record<string, string>;

export type ProductEditorUpdate = <Key extends keyof ProductEditorValues>(
  key: Key,
  value: ProductEditorValues[Key],
) => void;

export interface ProductEditorFieldsProps {
  values: ProductEditorValues;
  errors: ProductEditorErrors;
  update: ProductEditorUpdate;
  disabled?: boolean;
}
