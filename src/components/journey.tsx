"use client";

import { useEffect, useRef, useState } from "react";
import { BOOKING_CHECKS } from "@/lib/booking";
import { compareRedemption } from "@/lib/savings";
import { draftForMode, emptyDraft, exampleDraft, type TripDraft, type TripMode } from "@/lib/trip";
import { FIELD_ORDER, validateTrip, type FieldErrors } from "@/lib/validation";
import { CompareStep, type ComparePhase } from "./compare-step";
import { GuidanceStep } from "./guidance-step";
import { ModeStep } from "./mode-step";
import { StepRail, type StepId } from "./step-rail";
import { TripForm } from "./trip-form";

type Phase =
  | { name: "editing" }
  | ({ name: "calculating" } & { trip: TripDraft })
  | Extract<ComparePhase, { name: "ready" }>
  | Extract<ComparePhase, { name: "failed" }>;

export function Journey() {
  const [step, setStep] = useState<StepId>("mode");
  const [draft, setDraft] = useState<TripDraft>(emptyDraft());
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<Phase>({ name: "editing" });
  const [exampleNotice, setExampleNotice] = useState(false);
  const [carrierId, setCarrierId] = useState("");
  const [checks, setChecks] = useState<boolean[]>(() => BOOKING_CHECKS.map(() => false));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const skipFocus = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (skipFocus.current) {
      skipFocus.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, phase.name]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function clearTimer() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  function canVisit(target: StepId): boolean {
    if (target === "mode") return true;
    if (target === "trip") return draft.mode !== null;
    if (target === "compare") return phase.name !== "editing";
    return phase.name === "ready";
  }

  function goTo(target: StepId) {
    if (!canVisit(target)) return;
    if (target !== "compare") clearTimer();
    if (phase.name === "calculating" && target !== "compare") setPhase({ name: "editing" });
    setStep(target);
  }

  function onMode(mode: TripMode) {
    clearTimer();
    setDraft((current) => draftForMode(current, mode));
    setPhase({ name: "editing" });
    setErrors((current) => ({
      ...current,
      mode: undefined,
      travellers: undefined,
      adults: undefined,
      children: undefined,
    }));
  }

  function onChange(patch: Partial<TripDraft>) {
    clearTimer();
    setDraft((current) => ({ ...current, ...patch }));
    setPhase({ name: "editing" });
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
    clearTimer();
    setDraft(exampleDraft(draft.mode));
    setErrors({});
    setPhase({ name: "editing" });
    setExampleNotice(true);
    setTimeout(() => document.getElementById("cashPrice")?.focus(), 0);
  }

  function onSubmit() {
    const parsed = validateTrip(draft);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      const first = FIELD_ORDER.find((name) => parsed.errors[name]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    clearTimer();
    setErrors({});
    const trip = parsed.trip;
    setPhase({ name: "calculating", trip: draft });
    setStep("compare");
    timer.current = setTimeout(() => {
      const comparison = compareRedemption({
        cashPriceCents: trip.cashPriceCents,
        pointsRequired: trip.pointsRequired,
        taxesAndFeesCents: trip.taxesAndFeesCents,
      });
      if (comparison.status === "invalid") {
        setPhase({ name: "failed", issues: comparison.issues });
        return;
      }
      setPhase({ name: "ready", trip, comparison });
    }, 450);
  }

  function startOver() {
    clearTimer();
    setDraft(emptyDraft());
    setErrors({});
    setPhase({ name: "editing" });
    setExampleNotice(false);
    setCarrierId("");
    setChecks(BOOKING_CHECKS.map(() => false));
    setStep("mode");
  }

  const comparePhase: ComparePhase =
    phase.name === "editing" ? { name: "empty" } : phase.name === "calculating" ? { name: "calculating" } : phase;

  return (
    <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <StepRail current={step} canVisit={canVisit} onVisit={goTo} />
      <div className="mt-8">
        {step === "mode" ? (
          <ModeStep
            mode={draft.mode}
            headingRef={headingRef}
            onMode={onMode}
            onContinue={() => {
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
            onSubmit={onSubmit}
          />
        ) : null}
        {step === "compare" ? (
          <CompareStep
            phase={comparePhase}
            headingRef={headingRef}
            onBack={() => {
              clearTimer();
              if (phase.name === "calculating") setPhase({ name: "editing" });
              setStep("trip");
            }}
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
    </main>
  );
}
