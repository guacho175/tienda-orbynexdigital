import { z } from "zod";
import { ApiError } from "./http.js";

export interface FlowServerEnv {
  flowApiKey: string;
  flowSecretKey: string;
  flowBaseUrl: string;
  flowReturnUrl: string;
  flowConfirmationUrl: string;
  appPublicUrl: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

export interface SupabaseServerEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
}

// Esquema Zod para validar bajo demanda las variables del backend de Flow y Supabase
const flowServerEnvSchema = z.object({
  FLOW_API_KEY: z.string().min(1, "FLOW_API_KEY es requerida"),
  FLOW_SECRET_KEY: z.string().min(1, "FLOW_SECRET_KEY es requerida"),
  FLOW_BASE_URL: z.string().url("FLOW_BASE_URL debe ser una URL válida"),
  FLOW_RETURN_URL: z.string().url("FLOW_RETURN_URL debe ser una URL válida"),
  FLOW_CONFIRMATION_URL: z.string().url("FLOW_CONFIRMATION_URL debe ser una URL válida"),
  APP_PUBLIC_URL: z.string().url("APP_PUBLIC_URL debe ser una URL válida"),
  SUPABASE_URL: z.string().url("SUPABASE_URL debe ser una URL válida"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY es requerida"),
});

const supabaseServerEnvSchema = z.object({
  SUPABASE_URL: z.string().url("SUPABASE_URL debe ser una URL válida"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY es requerida"),
});

export function getFlowServerEnv(): FlowServerEnv {
  const envData = {
    FLOW_API_KEY: process.env.FLOW_API_KEY,
    FLOW_SECRET_KEY: process.env.FLOW_SECRET_KEY,
    FLOW_BASE_URL: process.env.FLOW_BASE_URL,
    FLOW_RETURN_URL: process.env.FLOW_RETURN_URL,
    FLOW_CONFIRMATION_URL: process.env.FLOW_CONFIRMATION_URL,
    APP_PUBLIC_URL: process.env.APP_PUBLIC_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const parsed = flowServerEnvSchema.safeParse(envData);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => i.message).join(", ");
    console.error(`[env.server] Error de validación de entorno: ${errorDetails}`);
    throw new ApiError(500, `Configuración de servidor incompleta: ${errorDetails}`);
  }

  return {
    flowApiKey: parsed.data.FLOW_API_KEY,
    flowSecretKey: parsed.data.FLOW_SECRET_KEY,
    flowBaseUrl: trimTrailingSlash(parsed.data.FLOW_BASE_URL),
    flowReturnUrl: parsed.data.FLOW_RETURN_URL,
    flowConfirmationUrl: parsed.data.FLOW_CONFIRMATION_URL,
    appPublicUrl: trimTrailingSlash(parsed.data.APP_PUBLIC_URL),
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getSupabaseServerEnv(): SupabaseServerEnv {
  const envData = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const parsed = supabaseServerEnvSchema.safeParse(envData);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map((i) => i.message).join(", ");
    console.error(`[env.server] Error de validación de Supabase Server: ${errorDetails}`);
    throw new ApiError(500, `Configuración de Supabase Admin incompleta: ${errorDetails}`);
  }

  return {
    supabaseUrl: parsed.data.SUPABASE_URL,
    supabaseServiceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getCronSecret(): string | null {
  return process.env.CRON_SECRET || null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
