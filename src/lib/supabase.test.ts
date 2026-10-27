import assert from "node:assert/strict";
import test from "node:test";
import {
  SupabaseConfigError,
  createSupabaseBrowserClient,
  readSupabasePublicConfig,
  supabasePublicConfigStatus,
} from "./supabase";

const url = "https://example.supabase.co";
const publishableKey = "sb_publishable_example_key";
const secretKey = "sb_secret_do_not_print_this_value";

test("reads a publishable Supabase configuration", () => {
  const config = readSupabasePublicConfig({
    NEXT_PUBLIC_SUPABASE_URL: ` ${url} `,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: ` ${publishableKey} `,
  });
  assert.equal(config.url, url);
  assert.equal(config.publishableKey, publishableKey);
});

test("explains a missing Supabase configuration without printing a key", () => {
  assert.throws(
    () => readSupabasePublicConfig({}),
    (error: unknown) => {
      assert.ok(error instanceof SupabaseConfigError);
      assert.match(error.message, /NEXT_PUBLIC_SUPABASE_URL/);
      assert.match(error.message, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
      assert.equal(error.message.includes(secretKey), false);
      return true;
    },
  );
  assert.throws(() => readSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: url }), SupabaseConfigError);
  assert.throws(
    () => readSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey }),
    SupabaseConfigError,
  );
  assert.throws(
    () =>
      readSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "   ",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: "   ",
      }),
    SupabaseConfigError,
  );
});

test("rejects a non-publishable key without including the key in the error", () => {
  assert.throws(
    () =>
      readSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: url,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: secretKey,
      }),
    (error: unknown) => {
      assert.ok(error instanceof SupabaseConfigError);
      assert.match(error.message, /publishable key/);
      assert.equal(error.message.includes(secretKey), false);
      assert.equal(error.message.includes("do_not_print_this_value"), false);
      return true;
    },
  );
  assert.throws(
    () =>
      readSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: "not a url",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
      }),
    SupabaseConfigError,
  );
});

test("reports public configuration status without returning the values", () => {
  const status = supabasePublicConfigStatus({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
  });
  assert.deepEqual(status, {
    urlPresent: true,
    keyPresent: true,
    urlIsHttps: true,
    keyHasPublishablePrefix: true,
  });
  assert.equal(JSON.stringify(status).includes(url), false);
  assert.equal(JSON.stringify(status).includes(publishableKey), false);
  assert.deepEqual(supabasePublicConfigStatus({}), {
    urlPresent: false,
    keyPresent: false,
    urlIsHttps: false,
    keyHasPublishablePrefix: false,
  });
  assert.equal(
    supabasePublicConfigStatus({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: secretKey,
    }).urlIsHttps,
    false,
  );
});

test("creates a browser client from the public configuration", () => {
  const client = createSupabaseBrowserClient({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
  });
  assert.equal(typeof client.from, "function");
});
