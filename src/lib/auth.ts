const SECRET_TEXT = /eyJ|sb_|bearer|api[_-]?key|access[_-]?token|refresh[_-]?token/i;

export type AuthSessionUser = {
  id: string;
  email?: string | null;
};

export type AuthCallResult = {
  data: { session: { user: AuthSessionUser } | null };
  error: { message: string } | null;
};

export type AccountAuth = {
  signInWithPassword(input: { email: string; password: string }): Promise<AuthCallResult>;
  signUp(input: { email: string; password: string; options?: { emailRedirectTo?: string } }): Promise<AuthCallResult>;
  signOut(): Promise<{ error: { message: string } | null }>;
};

export type AuthResult = { ok: true; pendingConfirmation: boolean } | { ok: false; message: string };

export function publicAuthMessage(message: string | undefined, fallback: string): string {
  const text = (message ?? "").trim();
  if (!text || SECRET_TEXT.test(text)) return fallback;
  return text;
}

export function validateAccountCredentials(email: string, password: string): string | null {
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Enter a valid email address.";
  if (password.length < 8) return "Use a password of at least 8 characters.";
  return null;
}

export async function signInWithEmail(auth: AccountAuth, email: string, password: string): Promise<AuthResult> {
  const invalid = validateAccountCredentials(email, password);
  if (invalid) return { ok: false, message: invalid };
  const { data, error } = await auth.signInWithPassword({ email: email.trim(), password });
  if (error || !data.session) {
    return { ok: false, message: publicAuthMessage(error?.message, "Sign-in did not start a session.") };
  }
  return { ok: true, pendingConfirmation: false };
}

export async function signUpWithEmail(
  auth: AccountAuth,
  email: string,
  password: string,
  emailRedirectTo?: string,
): Promise<AuthResult> {
  const invalid = validateAccountCredentials(email, password);
  if (invalid) return { ok: false, message: invalid };
  const { data, error } = await auth.signUp({
    email: email.trim(),
    password,
    options: emailRedirectTo ? { emailRedirectTo } : undefined,
  });
  if (error) return { ok: false, message: publicAuthMessage(error.message, "The account could not be created.") };
  return { ok: true, pendingConfirmation: data.session === null };
}

export async function signOutAccount(auth: AccountAuth): Promise<AuthResult> {
  const { error } = await auth.signOut();
  if (error) return { ok: false, message: publicAuthMessage(error.message, "Sign-out did not finish.") };
  return { ok: true, pendingConfirmation: false };
}
