"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { BOOKING_CHECKS } from "@/lib/booking";
import {
  comparisonErrorMessage,
  isAbortError,
  postComparison,
  shouldStartComparison,
  toComparisonRequest,
  type ComparisonResult,
} from "@/lib/comparison-api";
import { checklistAfter } from "@/lib/journey-rules";
import { CloudRecordsError } from "@/lib/cloud-records";
import {
  reloadSavedCloud,
  requestReopenedComparison,
  reopenedServerSnapshot,
  reopenedSnapshot,
  saveBrowserComparison,
  subscribeReopened,
} from "@/lib/cloud-browser";
import { displayTripForSavedResult, newRecordId } from "@/lib/local-records";
import { OPEN_COMPARE_EVENT } from "@/lib/navigation";
import { draftForMode, emptyDraft, exampleDraft, type TripDraft, type TripMode, type ValidatedTrip } from "@/lib/trip";
import { FIELD_ORDER, validateTrip, type FieldErrors } from "@/lib/validation";
import { CompareStep, type ComparePhase } from "./compare-step";

function subscribeToLocation() {
  return () => {};
}

function currentSearch() {
  return window.location.search;
}

function emptySearch() {
  return "";
}
import { GuidanceStep } from "./guidance-step";
import { HowItWorks } from "./how-it-works";
import { ModeStep } from "./mode-step";
import { StepRail, type StepId } from "./step-rail";
import { TripForm } from "./trip-form";

type Phase =
  | { name: "editing" }
  | { name: "calculating" }
  | { name: "ready"; trip: ValidatedTrip; result: ComparisonResult; savedAt?: string }
  | { name: "unavailable"; trip: ValidatedTrip; message: string };

export function Journey() {
  const [step, setStep] = useState<StepId>("mode");
  const [draft, setDraft] = useState<TripDraft>(emptyDraft());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>({ name: "editing" });
  const [exampleNotice, setExampleNotice] = useState(false);
  const [carrierId, setCarrierId] = useState("");
  const [checks, setChecks] = useState<boolean[]>(() => BOOKING_CHECKS.map(() => false));
  const [saveNotice, setSaveNotice] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingComparison, setSavingComparison] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipFocus = useRef(true);
  const inFlight = useRef(false);
  const requestSeq = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, phase.name]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const search = useSyncExternalStore(subscribeToLocation, currentSearch, emptySearch);
  const reopened = useSyncExternalStore(subscribeReopened, reopenedSnapshot, reopenedServerSnapshot);
  const [handledSearch, setHandledSearch] = useState("");
  const [openedSavedId, setOpenedSavedId] = useState("");
  const savedId = new URLSearchParams(search).get("saved") ?? "";
  if (search !== handledSearch) {
    setHandledSearch(search);
    if (new URLSearchParams(search).get("compare") === "1") setStep("compare");
  }
  if (savedId && reopened.id !== savedId) requestReopenedComparison(savedId);
  if (savedId && reopened.id === savedId && reopened.status === "ready" && reopened.record && openedSavedId !== savedId) {
    setOpenedSavedId(savedId);
    setPhase({
      name: "ready",
      trip: displayTripForSavedResult(reopened.record.result),
      result: reopened.record.result,
      savedAt: reopened.record.savedAt,
    });
    setStep("compare");
  }

  useEffect(() => {
    function openCompare() {
      setStep("compare");
    }
    window.addEventListener(OPEN_COMPARE_EVENT, openCompare);
    return () => window.removeEventListener(OPEN_COMPARE_EVENT, openCompare);
  }, []);

  function cancelRequest() {
    requestSeq.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    inFlight.current = false;
  }

  function canVisit(target: StepId): boolean {
    if (target === "mode" || target === "compare") return true;
    if (target === "trip") return draft.mode !== null;
    return phase.name === "ready";
  }

  function goTo(target: StepId) {
    if (!canVisit(target)) return;
    if (target !== "compare") cancelRequest();
    if (phase.name === "calculating" && target !== "compare") setPhase({ name: "editing" });
    setStep(target);
  }

  function onMode(mode: TripMode) {
    cancelRequest();
    setDraft((current) => draftForMode(current, mode));
    setPhase({ name: "editing" });
    setSaveNotice("");
    setSaveError("");
    setErrors((current) => ({
      ...current,
      mode: undefined,
      travellers: undefined,
      adults: undefined,
      children: undefined,
    }));
  }

  function onChange(patch: Partial<TripDraft>) {
    cancelRequest();
    setDraft((current) => ({ ...current, ...patch }));
    setPhase({ name: "editing" });
    setSaveNotice("");
    setSaveError("");
    setErrors((current) => {
      const next = { ...current };
      for (const key of Object.keys(patch) as (keyof TripDraft)[]) {
        if (key in next) delete next[key as keyof FieldErrors];
      }
      return next;
    });
    if ("cashPrice" in patch || "points" in patch || "taxes" in patch) setExampleNotice(false);
  }

  function onExample() {
    if (draft.mode !== "quick" && draft.mode !== "full") return;
    cancelRequest();
    setDraft(exampleDraft(draft.mode));
    setErrors({});
    setPhase({ name: "editing" });
    setExampleNotice(true);
    setTimeout(() => document.getElementById("cashPrice")?.focus(), 0);
  }

  async function runComparison(trip: ValidatedTrip) {
    if (!shouldStartComparison(inFlight.current)) return;
    inFlight.current = true;
    const id = requestSeq.current;
    const controller = new AbortController();
    abortRef.current = controller;
    setErrors({});
    setSaveNotice("");
    setSaveError("");
    setPhase({ name: "calculating" });
    setStep("compare");
    try {
      const result = await postComparison(toComparisonRequest(trip), { signal: controller.signal });
      if (id !== requestSeq.current) return;
      setChecks((current) => checklistAfter("comparison-ready", current));
      setPhase({ name: "ready", trip, result });
    } catch (error) {
      if (id !== requestSeq.current || isAbortError(error)) return;
      setPhase({ name: "unavailable", trip, message: comparisonErrorMessage(error) });
    } finally {
      if (id === requestSeq.current) {
        inFlight.current = false;
        abortRef.current = null;
      }
    }
  }

  async function onSaveComparison() {
    if (phase.name !== "ready" || phase.savedAt || savingComparison) return;
    const current = phase;
    setSavingComparison(true);
    setSaveNotice("");
    setSaveError("");
    setSaveError("");
    try {
      const saved = await saveBrowserComparison({
        id: newRecordId(),
        savedAt: new Date().toISOString(),
        result: current.result,
      });
      setPhase((existing) =>
        existing.name === "ready" && existing.result === current.result ? { ...existing, savedAt: saved.savedAt } : existing,
      );
      setSaveNotice("Saved with this account. The stored response is not recalculated.");
      void reloadSavedCloud();
    } catch (error) {
      setSaveError(error instanceof CloudRecordsError ? error.message : "The comparison could not be saved.");
    } finally {
      setSavingComparison(false);
    }
  }

  function onSubmit() {
    if (!shouldStartComparison(inFlight.current)) return;
    const parsed = validateTrip(draft);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      const first = FIELD_ORDER.find((name) => parsed.errors[name]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    void runComparison(parsed.trip);
  }

  function startOver() {
    cancelRequest();
    setDraft(emptyDraft());
    setErrors({});
    setPhase({ name: "editing" });
    setExampleNotice(false);
    setSaveNotice("");
    setSaveError("");
    setCarrierId("");
    setChecks((current) => checklistAfter("start-over", current));
    setStep("mode");
  }

  const comparePhase: ComparePhase = phase.name === "editing" ? { name: "empty" } : phase;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      {savedId && reopened.id === savedId && reopened.status === "loading" ? (
        <p className="mt-4 text-sm text-muted" role="status">
          Opening the saved comparison.
        </p>
      ) : null}
      {savedId && reopened.id === savedId && (reopened.status === "missing" || reopened.status === "error") ? (
        <p className="mt-4 text-sm font-medium text-cost" role="alert">
          {reopened.message}
        </p>
      ) : null}
      <StepRail current={step} canVisit={canVisit} onVisit={goTo} />
      <div className="mt-8">
        {step === "mode" ? (
          <ModeStep
            mode={draft.mode}
            headingRef={headingRef}
            onMode={onMode}
            onContinue={(nextMode) => {
              if (nextMode) {
                if (draft.mode !== nextMode) onMode(nextMode);
                setStep("trip");
                return;
              }
              if (draft.mode) setStep("trip");
            }}
          />
        ) : null}
        {step === "trip" ? (
          <TripForm
            draft={draft}
            errors={errors}
            exampleNotice={exampleNotice}
            headingRef={headingRef}
            onChange={onChange}
            onExample={onExample}
            submitting={phase.name === "calculating"}
            onSubmit={onSubmit}
          />
        ) : null}
        {step === "compare" ? (
          <CompareStep
            phase={comparePhase}
            headingRef={headingRef}
            onBack={() => {
              cancelRequest();
              if (phase.name === "calculating") setPhase({ name: "editing" });
              setStep("trip");
            }}
            onRetry={() => {
              if (phase.name === "unavailable") void runComparison(phase.trip);
            }}
            onSave={() => void onSaveComparison()}
            saveNotice={saveNotice}
            saveError={saveError}
            saving={savingComparison}
            onGuidance={() => {
              if (phase.name === "ready") setStep("guide");
            }}
          />
        ) : null}
        {step === "guide" && phase.name === "ready" ? (
          <GuidanceStep
            carrierId={carrierId}
            checks={checks}
            headingRef={headingRef}
            onCarrier={setCarrierId}
            onToggle={(index) =>
              setChecks((current) => current.map((checked, item) => (item === index ? !checked : checked)))
            }
            onEdit={() => setStep("trip")}
            onStartOver={startOver}
          />
        ) : null}
      </div>
      <HowItWorks />
    </main>
  );
}
