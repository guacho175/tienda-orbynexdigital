import { accountConfig } from "./account.config";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export function getAuthEmailRedirectUrl() {
  const baseUrl = getConfiguredPublicUrl() ?? getCurrentOrigin();
  return `${trimTrailingSlash(baseUrl)}${accountConfig.routes.account}`;
}

export function shouldBlockLocalRemoteSignup() {
  return isLocalBrowserOrigin() && isRemoteSupabaseProject() && !allowsLocalRemoteSignup();
}

function getConfiguredPublicUrl() {
  const value =
    import.meta.env.VITE_APP_PUBLIC_URL ||
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    process.env.VITE_APP_PUBLIC_URL ||
    process.env.APP_PUBLIC_URL;

  if (!value) return null;
  return trimTrailingSlash(value);
}

function getCurrentOrigin() {
  if (typeof window === "undefined") return "";
  return window.location.origin;
}

function isLocalBrowserOrigin() {
  if (typeof window === "undefined") return false;
  return LOCAL_HOSTNAMES.has(window.location.hostname);
}

function isRemoteSupabaseProject() {
  const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!supabaseUrl) return false;

  try {
    const hostname = new URL(supabaseUrl).hostname;
    return !LOCAL_HOSTNAMES.has(hostname);
  } catch {
    return false;
  }
}

function allowsLocalRemoteSignup() {
  return import.meta.env.VITE_ALLOW_REMOTE_AUTH_SIGNUP_FROM_LOCAL === "true";
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}
