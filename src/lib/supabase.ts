import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const PUBLISHABLE_KEY_PREFIX = "sb_publishable_";

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

export type SupabasePublicConfig = {
  url: string;
  publishableKey: string;
};

export type SupabasePublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  [key: string]: string | undefined;
};

const MISSING_CONFIG =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the frontend environment.";

const INVALID_URL = "NEXT_PUBLIC_SUPABASE_URL must be an http or https URL.";

const SECRET_KEY =
  "NEXT_PUBLIC_SUPABASE_ANON_KEY must be a Supabase publishable key. Do not put a secret or service-role key in the frontend.";

export type SupabaseConfigStatus = {
  urlPresent: boolean;
  keyPresent: boolean;
  urlIsHttps: boolean;
  keyHasPublishablePrefix: boolean;
};

/** Direct property reads so Next.js can inline the public values into the browser bundle. */
function supabaseEnv(env?: SupabasePublicEnv): SupabasePublicEnv {
  if (env) return env;
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

/** Presence checks only. The returned fields never include a URL or key. */
export function supabasePublicConfigStatus(env?: SupabasePublicEnv): SupabaseConfigStatus {
  const source = supabaseEnv(env);
  const url = (source.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const key = (source.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  let urlIsHttps = false;
  try {
    urlIsHttps = new URL(url).protocol === "https:";
  } catch {
    urlIsHttps = false;
  }
  return {
    urlPresent: url.length > 0,
    keyPresent: key.length > 0,
    urlIsHttps,
    keyHasPublishablePrefix: key.startsWith(PUBLISHABLE_KEY_PREFIX),
  };
}

export function readSupabasePublicConfig(env?: SupabasePublicEnv): SupabasePublicConfig {
  const source = supabaseEnv(env);
  const url = (source.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const publishableKey = (source.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

  if (!url || !publishableKey) {
    throw new SupabaseConfigError(MISSING_CONFIG);
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SupabaseConfigError(INVALID_URL);
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new SupabaseConfigError(INVALID_URL);
  }

  if (!publishableKey.startsWith(PUBLISHABLE_KEY_PREFIX)) {
    throw new SupabaseConfigError(SECRET_KEY);
  }

  return { url, publishableKey };
}

/** Browser-safe client. It uses only the public URL and publishable key. */
export function createSupabaseBrowserClient(env?: SupabasePublicEnv): SupabaseClient {
  const { url, publishableKey } = readSupabasePublicConfig(env);
  return createClient(url, publishableKey);
}

let browserClient: SupabaseClient | null = null;

/** One shared browser client so the auth session stays on a single instance. */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) browserClient = createSupabaseBrowserClient();
  return browserClient;
}
