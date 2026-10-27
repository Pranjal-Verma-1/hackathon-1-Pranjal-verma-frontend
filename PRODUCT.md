# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A traveller who already has a cash fare and a points quote, and wants to judge whether spending the points is the better trade.

## Product Purpose

A Una Milla estimates the cash difference between an entered fare and an entered points redemption: euros, a percentage when the cash fare is not zero, and whether the redemption appears worthwhile. Points are treated as already earned and are not given a euro price. Success is a clear, honest comparison the traveller can check before booking somewhere else.

## Positioning

The estimate uses only figures the traveller types. The app does not fetch live fares, check award availability, or book flights.

## Operating Context

A short demo journey: choose Quick Flight or Full Trip Plan, enter the trip, compare, then review a booking checklist. Switching modes keeps the route and carries the party size across. “Plan another trip” clears the journey on this device. A signed-in account can keep wallet balances and saved comparisons. Older copies in the browser can be copied onto that account without replacing different records already stored there. The explorer summarizes the saved estimates for that account and can copy or download them.

## Capabilities and Constraints

Next.js App Router frontend (TypeScript, Tailwind CSS), a separate NestJS comparison API, and Supabase for sign-in plus the signed-in account’s wallet and saved comparisons. Row Level Security limits each authenticated user to rows whose `user_id` is `auth.uid()`. The frontend uses only the publishable Supabase key. The traveller enters the cash fare, points, and taxes. The API returns the euro difference, the percentage when one is defined, and whether the redemption appears worthwhile. Points are treated as already earned. The app does not fetch live fares, check award availability, or book flights. Demo figures for Madrid to Barcelona are illustrative and must stay labeled that way. Full Trip Plan preferences are recorded and do not change the arithmetic. Browser records from before the account exist can be copied on request; the browser copy is kept.

## Brand Commitments

Name: A Una Milla. Voice: thoughtful, worldly, calm, precise, and trustworthy. Personality pinned by the redesign brief: editorial rather than corporate, warm rather than sterile, sophisticated rather than flashy or childish. Palette pinned: midnight navy, warm ivory, saffron, muted blue-grey, with green and red only for financial meaning. Headlines in an editorial serif, interface and figures in a readable sans. Motif: a mile marker and route, drawn, not emoji.

## Evidence on Hand

Illustrative example only: Madrid to Barcelona, €186 cash, 12,500 points, €42 taxes and fees. No testimonials, airline partnerships, or live prices exist, and none may be invented.

## Product Principles

- Show the trade in euros before explaining it.
- An unfavorable redemption stays visible.
- Every figure is either entered by the traveller or labeled illustrative.
- Points are treated as already earned. The comparison does not price them.
- The app points at a booking site. It does not fetch live fares, check award availability, or book flights.
- Preferences can be remembered without pretending they were priced.

## Accessibility & Inclusion

Readable contrast, labeled controls, keyboard access, visible focus, and comfortable tap targets. Motion yields to prefers-reduced-motion.
