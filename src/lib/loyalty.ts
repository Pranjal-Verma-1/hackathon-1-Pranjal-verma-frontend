import { CARRIERS } from "./booking";
import {
  PROGRAMS,
  SAMPLE_WALLET,
  TRANSFERS,
  airlinePrograms,
  bankPrograms,
  programById,
  type Program,
} from "./milla/programs";

export type LoyaltyProgram = Program;

/** Reference only. A listed ratio is not a promise for every card, country, or promotion. */
export const TRANSFER_REFERENCE_NOTE =
  "Transfer ratios below are reference information. They can vary by card, country, promotion, and program. A listed partner does not mean your account can transfer, and it does not mean an award seat exists.";

export const REFERENCE_RATIO_LABEL = "Reference 1:1";

export const loyaltyPrograms: readonly LoyaltyProgram[] = PROGRAMS;

export function loyaltyProgramById(id: string): LoyaltyProgram | null {
  return programById(id) ?? null;
}

export function airlineLoyaltyPrograms(): LoyaltyProgram[] {
  return airlinePrograms();
}

export function bankLoyaltyPrograms(): LoyaltyProgram[] {
  return bankPrograms();
}

export function referenceTransferLabel(bankId: string, airlineId: string): string | null {
  const partners = TRANSFERS[bankId] ?? [];
  return partners.includes(airlineId) ? REFERENCE_RATIO_LABEL : null;
}

/** Checklist airlines already used by this app. Google Flights is a search site, not a loyalty program. */
export function checklistAirlines() {
  return CARRIERS.filter((carrier) => carrier.id !== "google-flights");
}

const HOMEPAGES: Record<string, string> = {
  iberia: "https://www.iberia.com/",
  ba: "https://www.britishairways.com/",
  flyingblue: "https://www.airfrance.com/",
  mnm: "https://www.lufthansa.com/",
  klm: "https://www.klm.com/",
  aeroplan: "https://www.aircanada.com/",
  virgin: "https://www.virginatlantic.com/",
  aa: "https://www.aa.com/",
  united: "https://www.united.com/",
  turkish: "https://www.turkishairlines.com/",
  qatar: "https://www.qatarairways.com/",
};

export function loyaltyHomepage(id: string): string | null {
  const href = HOMEPAGES[id];
  if (!href) return null;
  try {
    const url = new URL(href);
    if (url.protocol !== "https:" || url.search !== "") return null;
  } catch {
    return null;
  }
  return href;
}

export type SampleBalance = { programId: string; balance: number };

/** Explicit sample figures. Nothing reads this until the traveller asks for it. */
export function sampleBalances(): SampleBalance[] {
  return Object.entries(SAMPLE_WALLET).map(([programId, balance]) => ({ programId, balance }));
}
