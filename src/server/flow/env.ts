import { ApiError } from "./http";

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

export function getFlowServerEnv(): FlowServerEnv {
  return {
    flowApiKey: requiredEnv("FLOW_API_KEY"),
    flowSecretKey: requiredEnv("FLOW_SECRET_KEY"),
    flowBaseUrl: trimTrailingSlash(requiredEnv("FLOW_BASE_URL")),
    flowReturnUrl: requiredEnv("FLOW_RETURN_URL"),
    flowConfirmationUrl: requiredEnv("FLOW_CONFIRMATION_URL"),
    appPublicUrl: trimTrailingSlash(requiredEnv("APP_PUBLIC_URL")),
    supabaseUrl: requiredEnv("SUPABASE_URL"),
    supabaseServiceRoleKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError(500, `Missing server environment variable: ${name}`);
  }
  return value;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}
