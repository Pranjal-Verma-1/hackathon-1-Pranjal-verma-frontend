import assert from "node:assert/strict";
import test from "node:test";
import {
  publicAuthMessage,
  signInWithEmail,
  signOutAccount,
  signUpWithEmail,
  validateAccountCredentials,
  type AccountAuth,
  type AuthCallResult,
} from "./auth";

const signedIn: AuthCallResult = {
  data: { session: { user: { id: "user-1", email: "ada@example.com" } } },
  error: null,
};

test("rejects an incomplete email or a short password before any auth call", async () => {
  assert.equal(validateAccountCredentials("ada", "long-enough"), "Enter a valid email address.");
  assert.equal(validateAccountCredentials("ada@example.com", "short"), "Use a password of at least 8 characters.");
  let called = false;
  const auth: AccountAuth = {
    async signInWithPassword() {
      called = true;
      return signedIn;
    },
    async signUp() {
      called = true;
      return signedIn;
    },
    async signOut() {
      called = true;
      return { error: null };
    },
  };
  const result = await signInWithEmail(auth, "ada", "short");
  assert.equal(result.ok, false);
  assert.equal(called, false);
});

test("hides secrets in auth errors and reports a missing session", async () => {
  assert.equal(publicAuthMessage("Invalid login credentials", "fallback"), "Invalid login credentials");
  assert.equal(publicAuthMessage("token eyJabc.def.ghi", "fallback"), "fallback");
  assert.equal(publicAuthMessage("sb_secret_value", "fallback"), "fallback");

  const auth: AccountAuth = {
    async signInWithPassword() {
      return { data: { session: null }, error: { message: "Bearer access_token leaked" } };
    },
    async signUp() {
      return signedIn;
    },
    async signOut() {
      return { error: null };
    },
  };
  const result = await signInWithEmail(auth, "ada@example.com", "long-enough");
  assert.deepEqual(result, { ok: false, message: "Sign-in did not start a session." });
});

test("sign-up without a session asks for email confirmation", async () => {
  const auth: AccountAuth = {
    async signInWithPassword() {
      return signedIn;
    },
    async signUp(input) {
      assert.equal(input.email, "ada@example.com");
      assert.equal(input.options?.emailRedirectTo, "http://localhost:3000/account");
      return { data: { session: null }, error: null };
    },
    async signOut() {
      return { error: null };
    },
  };
  const result = await signUpWithEmail(auth, " ada@example.com ", "long-enough", "http://localhost:3000/account");
  assert.deepEqual(result, { ok: true, pendingConfirmation: true });
});

test("sign-out reports a safe failure", async () => {
  const auth: AccountAuth = {
    async signInWithPassword() {
      return signedIn;
    },
    async signUp() {
      return signedIn;
    },
    async signOut() {
      return { error: { message: "refresh_token sb_secret_value" } };
    },
  };
  const result = await signOutAccount(auth);
  assert.deepEqual(result, { ok: false, message: "Sign-out did not finish." });
});
