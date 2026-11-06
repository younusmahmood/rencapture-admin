# Deploying RenCapture Admin

This app is built and deployed exactly like `../rencapture-web` — same
stateless-container pattern, same AWS target, same GitHub Actions OIDC setup.
**Read `../rencapture-web/DEPLOY.md` first** for the full walkthrough
(compute target choice, IAM roles, OIDC trust-policy gotcha, logging
obligations). This file only covers what's different for this app.

## Why a separate service, not a route inside the console

This account can provision or disable *any* clinic on the platform and signs
in with a single hardcoded email (`convex/lib/operatorAccess.ts`). Keeping it
a genuinely separate deployable — separate container, separate domain,
separate session cookie and `SESSION_SECRET` — means a bug or compromise in
the clinic console's much larger surface area (patient charts, file uploads,
member management for every clinic) can't reach this one for free. It costs
a second ECR repo and a second App Runner service; that's a cheap trade for
an account with this much reach.

## What's different from rencapture-web's deploy

- **Separate ECR repository** (e.g. `rencapture-admin`) and **separate App
  Runner service**. Don't reuse the console's.
- **Separate `SESSION_SECRET`.** Generate a fresh one — reusing the
  console's would mean a leak of one secret compromises both cookie
  namespaces at once, defeating the point of separating the apps.
- **Same `CONVEX_URL`** — this app talks to the identical Convex deployment
  as the mobile app and the console. There is nothing clinic-specific to
  configure.
- **Port 47391** instead of the console's 41823 (so both can run locally at
  once without a collision).
- **GitHub Actions vars** are named the same as the console's workflow but
  are a **separate set** — `ECR_REPOSITORY`, `APPRUNNER_SERVICE_ARN`, and
  `ADMIN_URL` (the console's workflow uses `CONSOLE_URL`) all need their own
  values in this repo's GitHub settings, even though `AWS_REGION`,
  `AWS_DEPLOY_ROLE_ARN`, and `CONVEX_URL` can point at the same underlying
  resources if you choose to share an OIDC role across both apps (or create
  a second role scoped only to this app's ECR repo/service — the latter is
  more isolated and consistent with the reasoning above).

## Who can actually reach this once it's deployed

Nobody but `younus@theymsgroup.com` — enforced twice: `requestCode` in
`convex/operator.ts` never issues a code to another address (and gives a
generic response either way, so the sign-in page can't be used to enumerate
who's an operator), and `verifyCode`/every operator-scoped function re-checks
the same allowlist server-side. Putting this behind a further network-level
control (a VPN, an IP allowlist on the App Runner/ALB listener, or leaving it
off a public domain entirely and reaching it through a private link) is
reasonable extra hardening given what the account can do — worth doing before
this ever holds a real customer's data, not required to make the access
control itself correct.
