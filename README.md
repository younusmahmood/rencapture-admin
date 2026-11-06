# rencapture-admin

Internal RenCapture tool: provision new clinics and disable/re-enable them.
Not customer-facing — see `CLAUDE.md` for the full picture and `DEPLOY.md`
for shipping it.

## Getting started

```bash
npm install
cp .env.example .env   # fill in CONVEX_URL (same deployment as the mobile
                        # app and console) and a fresh SESSION_SECRET
npm run dev             # http://localhost:47391
```

Sign-in is restricted to a hardcoded allowlist
(`../rencapture/convex/lib/operatorAccess.ts`) — currently
`younus@theymsgroup.com` only. In development, with no `RESEND_API_KEY` set
on the Convex deployment, the one-time code is shown on the sign-in page
instead of emailed.

## Scripts

```bash
npm run dev              # dev server, port 47391
npm run build             # production build
npm run typecheck         # tsc --noEmit
npm run generate-routes   # regenerate src/routeTree.gen.ts (never hand-edit it)
npm start                 # run the production build (node serve.mjs)
```
