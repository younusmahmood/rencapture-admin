# rencapture-admin

Internal operator tool for RenCapture. Its entire job: provision new clinics
and disable/re-enable them. Nothing else — clinic-internal management (team
members, patient charts, settings) stays in `../rencapture-web`'s console,
run by each clinic's own admin.

Sibling repos, same Convex backend:
- `../rencapture` — the Expo mobile app (source of truth for the data model)
- `../rencapture-web` — the clinic-facing console (landing page + `/console`)
- **this repo** — the operator-facing provisioning tool

## Why this is a separate app, not a page in the console

Explained at length in `DEPLOY.md`. Short version: this account can act on
*any* clinic, so it gets its own deployable, its own session cookie
(`rc_admin`, distinct from the console's `rc_console`), and its own
`SESSION_SECRET` — isolation the console's much larger, multi-tenant surface
area can't offer for free.

## Stack

Same as `rencapture-web`: TanStack Start, Vite 8, Tailwind v4, Convex via
`ConvexHttpClient` from the server only (the browser never holds a session
token — see `../rencapture-web/CLAUDE.md`'s "why everything goes through
server functions" section, identical reasoning here).

Deliberately smaller than the console:
- **No custom fonts, no fontsource** — system font stack. This is a tool one
  person uses, not a branded surface.
- **No Zustand, no react-query** — three routes, no client state worth a
  store.
- **One small `src/components/ui.tsx`** instead of the console's larger kit.
- **Neutral slate/indigo palette**, deliberately distinct from both the
  mobile app's Porcelain/Onyx and the console's matching theme — visually
  unmistakable as "the ops tool," not something a clinic user could confuse
  for their own console.

Port **47391** (`--strictPort`, same reasoning as the console's 41823 — this
machine runs many projects, pick something nothing else claims).

## Auth model

Backend lives in `../rencapture/convex/operator.ts` +
`../rencapture/convex/lib/operatorAccess.ts` — **not** `convex/auth.ts`,
which is clinic auth. Two completely separate systems sharing only the OTP
primitive (`consumeAuthCode` in `convex/lib/access.ts`):

- Who may sign in: a **hardcoded allowlist**
  (`OPERATOR_EMAILS` in `operatorAccess.ts`), currently just
  `younus@theymsgroup.com`. Not a database table, not an env var — adding an
  operator is a code change and a deploy, deliberately not something a config
  flip can do.
- `requestCode` gives the **same response shape** whether or not the email is
  on the allowlist (no code is generated for an unknown email, but the caller
  can't tell that from the response) — a sign-in page shouldn't confirm or
  deny who holds platform-wide power.
- Session: sealed httpOnly cookie, 15 min idle / 12 h absolute — same
  discipline as the console, because this account is at least as sensitive.
- There is no operator signup, ever. The allowlist is the only door.

## What it actually does

`convex/operator.ts`:
- `listClinics` / `getClinic` — read, with member rosters.
- `provisionClinic` — the **only** way a clinic now comes into existence.
  Creates the clinic plus its first admin (`status: "invited"`); that admin
  activates on their first ordinary sign-in through the mobile app or the
  console, exactly like a team-invited member. This replaced the self-signup
  flow that used to live in `auth.ts` — self-signup is gone, structurally,
  not just hidden in the UI (`auth.verifyCode` no longer accepts a `signup`
  payload at all).
- `setClinicStatus` — the kill switch. Disabling revokes every session for
  every member of that clinic **immediately** (not at next expiry) and sets
  `clinics.status = "disabled"`, which `requireUser` in
  `../rencapture/convex/lib/access.ts` checks on every authenticated call
  going forward (`CLINIC_DISABLED`) — so it also blocks sign-in attempts that
  happen after the initial session sweep. Verified live: an already-issued
  session token stops working the moment a clinic is disabled, and a fresh
  sign-in attempt for that clinic is rejected too.
- `updateClinic` — edit name/address/phone.

## Environment

Copy `.env.example` to `.env`:
- `CONVEX_URL` — same deployment as the mobile app and console
- `SESSION_SECRET` — 32+ random chars, **must differ from the console's**

## Current state (2026-08-01)

Built, typechecked, built (`npm run build`), and verified end-to-end against
the live dev Convex deployment via a throwaway `e2e-smoke.mjs` (deleted after
use): unauthenticated redirect, non-operator gets no code and is rejected,
real operator sign-in with a sealed cookie, dashboard render, clinic
provisioning, and the disable/re-enable toggle — including confirming at the
Convex level (not just the UI label) that disabling actually revokes an
already-active session. Test data cleaned up after.

No git remote, no commits yet, same as the other two repos.
