import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  PRODUCT_EDITOR_FIELD_SECTION,
  PRODUCT_EDITOR_SECTIONS,
  type ProductEditorSectionId,
} from "@/config/product-editor.config";
import {
  uploadProductImageVariants,
  validateProductImage,
  type ProductImageUploadResult,
} from "@/services/storage.service";
import type { ProductInput } from "@/services/products.service";
import type { Product } from "@/types/product";
import {
  createProductEditorValues,
  slugifyProductName,
  toProductInput,
} from "./product-editor.mappers";
import { productEditorSchema, type ProductEditorValues } from "./product-editor.schema";
import type { ProductEditorErrors } from "./product-editor.types";

interface UseProductEditorOptions {
  initial?: Product | null;
  onSubmit: (values: ProductInput) => Promise<void>;
}

function countErrorsBySection(errors: ProductEditorErrors) {
  const counts = Object.fromEntries(
    PRODUCT_EDITOR_SECTIONS.map((section) => [section.id, 0]),
  ) as Record<ProductEditorSectionId, number>;

  for (const field of Object.keys(errors)) {
    const section =
      PRODUCT_EDITOR_FIELD_SECTION[field as keyof typeof PRODUCT_EDITOR_FIELD_SECTION];
    if (section) counts[section] += 1;
  }

  return counts;
}

export function useProductEditor({ initial, onSubmit }: UseProductEditorOptions) {
  const initialValues = useMemo(() => createProductEditorValues(initial), [initial]);
  const [baseline, setBaseline] = useState(initialValues);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<ProductEditorErrors>({});
  const [activeSection, setActiveSection] = useState<ProductEditorSectionId>("general");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadPhase, setImageUploadPhase] = useState<"optimizing" | "uploading" | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadResult, setImageUploadResult] = useState<ProductImageUploadResult | null>(null);

  const isDirty = JSON.stringify(values) !== JSON.stringify(baseline);
  const errorCountBySection = useMemo(() => countErrorsBySection(errors), [errors]);
  const hasLegacyImage =
    Boolean(values.image_url) &&
    (!values.image_url_thumb || !values.image_url_card || !values.image_url_detail);
  const hasOptimizedVariants = Boolean(
    values.image_url_thumb && values.image_url_card && values.image_url_detail,
  );

  useEffect(() => {
    if (!isDirty) return;

    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  function update<Key extends keyof ProductEditorValues>(
    key: Key,
    value: ProductEditorValues[Key],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function updateName(value: string) {
    const shouldGenerateSlug = !initial && !values.slug;
    setValues((current) => ({
      ...current,
      name: value,
      slug: shouldGenerateSlug ? slugifyProductName(value) : current.slug,
    }));
    setErrors((current) => {
      if (!current.name && !(shouldGenerateSlug && current.slug)) return current;
      const next = { ...current };
      delete next.name;
      if (shouldGenerateSlug) delete next.slug;
      return next;
    });
  }

  function updateManualImageUrl(value: string) {
    setValues((current) => ({
      ...current,
      image_url: value,
      image_url_thumb: "",
      image_url_card: "",
      image_url_detail: "",
    }));
    setErrors((current) => {
      if (!current.image_url && !current.image_upload) return current;
      const next = { ...current };
      delete next.image_url;
      delete next.image_upload;
      return next;
    });
    setImageUploadError(null);
    setImageUploadResult(null);
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file) return;

    const validationError = validateProductImage(file);
    if (validationError) {
      setImageUploadError(validationError);
      setImageUploadResult(null);
      return;
    }

    setImageUploadError(null);
    setImageUploadResult(null);
    setErrors((current) => {
      if (!current.image_upload) return current;
      const next = { ...current };
      delete next.image_upload;
      return next;
    });
    setImageUploadPhase("optimizing");
    setUploadingImage(true);

    try {
      const result = await uploadProductImageVariants(file, {
        onPhaseChange: setImageUploadPhase,
      });
      setValues((current) => ({
        ...current,
        image_url: result.detailUrl,
        image_url_thumb: result.thumbUrl,
        image_url_card: result.cardUrl,
        image_url_detail: result.detailUrl,
      }));
      setErrors((current) => {
        if (!current.image_url && !current.image_upload) return current;
        const next = { ...current };
        delete next.image_url;
        delete next.image_upload;
        return next;
      });
      setImageUploadResult(result);
    } catch (error) {
      setImageUploadError(
        error instanceof Error
          ? error.message
          : "No se pudo subir la imagen. Revisa permisos e intenta nuevamente.",
      );
    } finally {
      setUploadingImage(false);
      setImageUploadPhase(null);
    }
  }

  function focusFirstError(fields: string[]) {
    const firstField = fields[0];
    if (!firstField) return;

    const section =
      PRODUCT_EDITOR_FIELD_SECTION[firstField as keyof typeof PRODUCT_EDITOR_FIELD_SECTION] ??
      "general";
    setActiveSection(section);

    window.setTimeout(() => {
      const targetId = firstField === "image_upload" ? "product_image_upload" : firstField;
      document.getElementById(targetId)?.focus();
    }, 0);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    if (uploadingImage) {
      const nextErrors = { image_upload: "Espera a que termine la subida de imagen." };
      setErrors(nextErrors);
      focusFirstError(Object.keys(nextErrors));
      return;
    }

    const parsed = productEditorSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: ProductEditorErrors = {};
      for (const issue of parsed.error.issues) {
        nextErrors[issue.path.join(".")] = issue.message;
      }
      setErrors(nextErrors);
      focusFirstError(Object.keys(nextErrors));
      return;
    }

    if (imageUploadError) {
      const nextErrors = { image_upload: "Corrige la subida de imagen antes de guardar." };
      setErrors(nextErrors);
      focusFirstError(Object.keys(nextErrors));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(toProductInput(parsed.data));
      setBaseline(parsed.data);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    values,
    errors,
    activeSection,
    setActiveSection,
    submitting,
    uploadingImage,
    imageUploadPhase,
    imageUploadError,
    imageUploadResult,
    isDirty,
    errorCountBySection,
    hasLegacyImage,
    hasOptimizedVariants,
    update,
    updateName,
    updateManualImageUrl,
    handleImageUpload,
    handleSubmit,
  };
}
