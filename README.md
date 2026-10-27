# A Una Milla

A Una Milla compares a cash fare with a points redemption using numbers the traveller already has. It shows the euro difference, the percentage when one exists, and whether the redemption appears worthwhile.

Points are treated as already earned. The app does not fetch live fares, check award availability, or book flights.

## Features

- Quick Flight and Full Trip Plan. Switching modes keeps the route and carries the party size across.
- The form checks the route, dates, party, cash fare, points, and taxes before anything is sent.
- A comparison request goes to the NestJS API. The screen shows loading, an error with retry, and blocks a second submit while a request is in flight.
- A positive result shows the estimated saving. A negative result stays visible as extra cash due. A zero cash fare does not show a percentage.
- The Madrid to Barcelona sample (€186 cash, 12,500 points, €42 taxes and fees) is labeled as an illustrative example.
- Full Trip Plan preferences are kept with the trip and do not change the comparison.
- After a result, a checklist points at airline and Google Flights homepages. Those links do not carry the trip, and the app does not issue tickets.
- A signed-in account stores wallet balances and saved comparisons in Supabase. Row Level Security lets that account read and change only its own rows.
- The explorer totals those saved estimates, compares an entered cash fare with the entered redemption taxes, and can copy or download a summary. A percentage that was not returned stays unavailable. The explorer does not search fares or check award seats.
- Older balances and comparisons kept in this browser can be copied to the account from the account page. The copy does not replace different account records, and it leaves the browser copy in place.

## Architecture

The frontend is a Next.js App Router application (TypeScript, Tailwind CSS). It validates the form, then `POST`s the amounts to the comparison API. Sign-in, wallet balances, and saved comparisons use Supabase with the publishable browser key.

The backend is a separate NestJS service, [hackathon-1-Pranjal-verma-backend](https://github.com/Pranjal-Verma-1/hackathon-1-Pranjal-verma-backend). It calculates the estimate. The comparison request does not include a wallet balance or a saved record.

```text
Browser (localhost:3000)
  -> POST /api/comparisons
NestJS API (localhost:3001)

Browser (localhost:3000)
  -> Supabase Auth and the account's own rows
```

The API allows the browser origin `http://localhost:3000` unless `FRONTEND_ORIGIN` is set on the backend.

## Local setup

Use Node.js 22 or newer. Start the API first, then this app. Open the site at `http://localhost:3000`. The API does not accept a browser origin of `http://127.0.0.1:3000`.

```bash
# Backend, in hackathon-1-Pranjal-verma-backend
npm install
npm run start:dev
```

```bash
# Frontend, in this repository
cp .env.example .env.local
npm install
npm run dev -- --hostname localhost --port 3000
```

`NEXT_PUBLIC_API_BASE_URL` is read when the dev server starts. Restart `npm run dev` after changing it.

## Environment variables

| Name | Where | Example | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Frontend `.env.local` | `http://localhost:3001` | Comparison API origin. No trailing path. |
| `FRONTEND_ORIGIN` | Backend environment | `http://localhost:3000` | Browser origin allowed by CORS. Optional; this is the default. |
| `PORT` | Backend environment | `3001` | API port. Optional; 3001 is the default. |
| `NEXT_PUBLIC_SUPABASE_URL` | Frontend `.env.local` | `https://your-project.supabase.co` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend `.env.local` | `sb_publishable_your_key_here` | Publishable browser key. Do not put a secret or service-role key here. |

Copy `.env.example` to `.env.local`. `.env.local` stays uncommitted. Do not put secrets in `.env.example`. The Supabase key in the frontend is the publishable key only. Database access for signed-in users is limited by Row Level Security: each policy checks `auth.uid() = user_id` for select, insert, update, and delete.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Next.js dev server. |
| `npm test` | Run the unit tests. |
| `npm run typecheck` | Typecheck with `tsc --noEmit`. |
| `npm run lint` | Run ESLint. |
| `npm run build` | Production build. |
| `npm start` | Serve the production build. |

## API behavior

`GET /api/health` returns `{ "status": "ok" }`.

`POST /api/comparisons` accepts JSON:

| Field | Type |
| --- | --- |
| `origin` | string |
| `destination` | string |
| `cashFareEuros` | number |
| `pointsRequired` | integer |
| `redemptionTaxesFeesEuros` | number |

A successful response repeats those fields and adds:

| Field | Meaning |
| --- | --- |
| `estimatedSavingsEuros` | Cash fare minus redemption taxes and fees. Negative when the redemption asks for more cash. |
| `estimatedSavingsPercent` | That difference as a percentage of the cash fare. `null` when the cash fare is zero. |
| `appearsWorthwhile` | `true` only when the euro difference is positive. |
| `explanation` | Plain-language result. It does not price the points, and it is not a booking. |

The sample request is Madrid (`MAD`) to Barcelona (`BCN`), a cash fare of 186, 12500 points, and taxes of 42. The service returns an estimated saving of 144 euros, about 77.42 percent, and `appearsWorthwhile: true`.

An invalid body returns HTTP 400. If the service cannot be reached, the form keeps the trip and offers a retry. Nothing is booked.

## Honest limitations

- Fares, points, and taxes come only from what the traveller types. There is no airline search.
- Points are already earned. The comparison does not give them a euro price.
- Award seats are not checked. A worthwhile result is not a held seat.
- Booking links are public homepages. The checklist is a reminder, not a ticket.
- The Madrid to Barcelona amounts are a sample, not a current quote.
- Wallet balances are not sent with a comparison and are not treated as transferable or enough for a redemption.
- Saved comparisons store the API response and the time they were saved. Opening one does not calculate it again.
- Browser records under `aum.wallet.v1` and `aum.saved-comparisons.v1` stay in local storage until you choose Copy to this account. That action skips a balance or comparison the account already has when the stored details differ.
- There is no deployed service in this setup. The app and the comparison API run on your machine, and Supabase is the account database.
