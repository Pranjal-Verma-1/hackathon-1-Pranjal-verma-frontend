import {
  CloudRecordsError,
  addAccountSampleBalances,
  findAccountComparison,
  listAccountBalances,
  listAccountComparisons,
  removeAccountBalance,
  removeAccountComparison,
  saveAccountBalance,
  saveAccountComparison,
  type CloudClient,
} from "./cloud-records";
import type { SavedComparison, WalletEntry } from "./local-records";
import { SupabaseConfigError, getSupabaseBrowserClient } from "./supabase";

export function browserCloudClient(): CloudClient {
  return getSupabaseBrowserClient() as unknown as CloudClient;
}

export type WalletCloudView = {
  status: "loading" | "signed-out" | "ready" | "unavailable";
  entries: WalletEntry[];
  message: string;
};

export type SavedCloudView = {
  status: "loading" | "signed-out" | "ready" | "unavailable";
  records: SavedComparison[];
  message: string;
};

const WALLET_LOADING: WalletCloudView = { status: "loading", entries: [], message: "" };
const SAVED_LOADING: SavedCloudView = { status: "loading", records: [], message: "" };

const walletListeners = new Set<() => void>();
const savedListeners = new Set<() => void>();
let walletView = WALLET_LOADING;
let savedView = SAVED_LOADING;
let walletStarted = false;
let savedStarted = false;
let walletRefresh: (() => Promise<void>) | null = null;
let savedRefresh: (() => Promise<void>) | null = null;

export function walletCloudServerSnapshot(): WalletCloudView {
  return WALLET_LOADING;
}

export function walletCloudSnapshot(): WalletCloudView {
  return walletView;
}

export function subscribeWalletCloud(listener: () => void): () => void {
  walletListeners.add(listener);
  startWalletCloud();
  return () => walletListeners.delete(listener);
}

export function savedCloudServerSnapshot(): SavedCloudView {
  return SAVED_LOADING;
}

export function savedCloudSnapshot(): SavedCloudView {
  return savedView;
}

export function subscribeSavedCloud(listener: () => void): () => void {
  savedListeners.add(listener);
  startSavedCloud();
  return () => savedListeners.delete(listener);
}

export function reloadWalletCloud(): Promise<void> {
  return walletRefresh?.() ?? Promise.resolve();
}

export function reloadSavedCloud(): Promise<void> {
  return savedRefresh?.() ?? Promise.resolve();
}

export type ReopenedComparison = {
  id: string;
  status: "idle" | "loading" | "ready" | "missing" | "error";
  record: SavedComparison | null;
  message: string;
};

const REOPEN_IDLE: ReopenedComparison = { id: "", status: "idle", record: null, message: "" };
const reopenListeners = new Set<() => void>();
let reopened = REOPEN_IDLE;

export function reopenedServerSnapshot(): ReopenedComparison {
  return REOPEN_IDLE;
}

export function reopenedSnapshot(): ReopenedComparison {
  return reopened;
}

export function subscribeReopened(listener: () => void): () => void {
  reopenListeners.add(listener);
  return () => reopenListeners.delete(listener);
}

const reopenPending = new Set<string>();

export function requestReopenedComparison(id: string) {
  if (reopenPending.has(id) || (reopened.id === id && (reopened.status === "loading" || reopened.status === "ready"))) return;
  reopenPending.add(id);
  queueMicrotask(() => {
    reopenPending.delete(id);
    if (reopened.id === id && (reopened.status === "loading" || reopened.status === "ready")) return;
    reopened = { id, status: "loading", record: null, message: "" };
    publishReopen();
    void loadReopened(id);
  });
}

function publishWallet(next: WalletCloudView) {
  if (next.status === walletView.status && next.message === walletView.message && sameEntries(next.entries, walletView.entries)) {
    return;
  }
  walletView = next;
  for (const listener of walletListeners) listener();
}

function publishSaved(next: SavedCloudView) {
  if (
    next.status === savedView.status &&
    next.message === savedView.message &&
    JSON.stringify(next.records) === JSON.stringify(savedView.records)
  ) {
    return;
  }
  savedView = next;
  for (const listener of savedListeners) listener();
}

function publishReopen() {
  for (const listener of reopenListeners) listener();
}

function sameEntries(left: WalletEntry[], right: WalletEntry[]) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function viewFromError(error: unknown, fallback: string): { status: "signed-out" | "unavailable"; message: string } {
  if (error instanceof CloudRecordsError && error.code === "session") {
    return { status: "signed-out", message: error.message };
  }
  if (error instanceof SupabaseConfigError) return { status: "unavailable", message: error.message };
  if (error instanceof CloudRecordsError) return { status: "unavailable", message: error.message };
  return { status: "unavailable", message: fallback };
}

function startWalletCloud() {
  if (walletStarted || typeof window === "undefined") return;
  walletStarted = true;
  let client: CloudClient;
  try {
    client = browserCloudClient();
  } catch (error) {
    const view = viewFromError(error, "Supabase is not configured.");
    publishWallet({ status: view.status, entries: [], message: view.message });
    return;
  }
  const refresh = async () => {
    try {
      const entries = await listAccountBalances(client);
      publishWallet({ status: "ready", entries, message: "" });
    } catch (error) {
      const view = viewFromError(error, "The balances could not be loaded.");
      publishWallet({ status: view.status, entries: [], message: view.message });
    }
  };
  walletRefresh = refresh;
  void refresh();
  const auth = getSupabaseBrowserClient().auth;
  auth.onAuthStateChange(() => {
    void refresh();
  });
}

function startSavedCloud() {
  if (savedStarted || typeof window === "undefined") return;
  savedStarted = true;
  let client: CloudClient;
  try {
    client = browserCloudClient();
  } catch (error) {
    const view = viewFromError(error, "Supabase is not configured.");
    publishSaved({ status: view.status, records: [], message: view.message });
    return;
  }
  const refresh = async () => {
    try {
      const records = await listAccountComparisons(client);
      publishSaved({ status: "ready", records, message: "" });
    } catch (error) {
      const view = viewFromError(error, "The saved comparisons could not be loaded.");
      publishSaved({ status: view.status, records: [], message: view.message });
    }
  };
  savedRefresh = refresh;
  void refresh();
  getSupabaseBrowserClient().auth.onAuthStateChange(() => {
    void refresh();
  });
}

async function loadReopened(id: string) {
  try {
    const record = await findAccountComparison(browserCloudClient(), id);
    if (reopened.id !== id) return;
    reopened = record
      ? { id, status: "ready", record, message: "" }
      : { id, status: "missing", record: null, message: "That saved comparison is not on this account." };
  } catch (error) {
    if (reopened.id !== id) return;
    const view = viewFromError(error, "The saved comparison could not be opened.");
    reopened = { id, status: "error", record: null, message: view.message };
  }
  publishReopen();
}

export function saveBrowserBalance(programId: string, balance: number) {
  return saveAccountBalance(browserCloudClient(), programId, balance);
}

export function removeBrowserBalance(programId: string) {
  return removeAccountBalance(browserCloudClient(), programId);
}

export function addBrowserSampleBalances() {
  return addAccountSampleBalances(browserCloudClient());
}

export function saveBrowserComparison(record: SavedComparison) {
  return saveAccountComparison(browserCloudClient(), record);
}

export function removeBrowserComparison(id: string) {
  return removeAccountComparison(browserCloudClient(), id);
}
