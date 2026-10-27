import { SupabaseConfigError, getSupabaseBrowserClient } from "./supabase";

export type AccountView = {
  status: "loading" | "signed-out" | "signed-in" | "unavailable";
  email: string | null;
  message: string;
};

const LOADING_ACCOUNT: AccountView = { status: "loading", email: null, message: "" };
const listeners = new Set<() => void>();
let current = LOADING_ACCOUNT;
let started = false;

export function accountServerSnapshot(): AccountView {
  return LOADING_ACCOUNT;
}

export function accountClientSnapshot(): AccountView {
  return current;
}

export function subscribeAccount(listener: () => void): () => void {
  listeners.add(listener);
  startAccountSession();
  return () => listeners.delete(listener);
}

function publish(next: AccountView) {
  if (current.status === next.status && current.email === next.email && current.message === next.message) return;
  current = next;
  for (const listener of listeners) listener();
}

function viewFromUser(user: { email?: string | null } | null | undefined): AccountView {
  if (!user) return { status: "signed-out", email: null, message: "" };
  return { status: "signed-in", email: user.email ?? null, message: "" };
}

function startAccountSession() {
  if (started || typeof window === "undefined") return;
  started = true;
  let client: ReturnType<typeof getSupabaseBrowserClient>;
  try {
    client = getSupabaseBrowserClient();
  } catch (error) {
    const message = error instanceof SupabaseConfigError ? error.message : "Supabase is not configured.";
    publish({ status: "unavailable", email: null, message });
    return;
  }

  void client.auth.getSession().then(({ data, error }) => {
    if (error || !data.session) {
      publish({ status: "signed-out", email: null, message: "" });
      return;
    }
    publish(viewFromUser(data.session.user));
  });

  client.auth.onAuthStateChange((_event, session) => {
    publish(viewFromUser(session?.user));
  });
}
