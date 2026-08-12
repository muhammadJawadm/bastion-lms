# Bastion Frontend

Standalone React + TypeScript frontend for Bastion Risk & Safety Group — the marketing site and the LMS. No backend in this project; it's a pure static SPA for UI work.

## Run it

```
pnpm install
pnpm dev       # http://localhost:5173
pnpm build     # outputs to dist/
pnpm check     # TypeScript
```

## What changed vs. the original repo

Copied straight from `bastion-safety-main/client/src`, with the Manus platform dependency removed:

- No Express/tRPC server, no Drizzle/database, no `.env` requirement to run.
- `src/lib/trpc.ts` — the tRPC client is now untyped (`as any`) since there's no backend router to type it against. Swap in the real `AppRouter` type once a backend exists.
- `src/const.ts` — inlined the two constants that used to come from the (now-removed) `shared/` package.
- `index.html` — removed the Manus analytics script tag.
- `vite.config.ts` — removed Manus's dev-server plugins and `allowedHosts` restriction.

## Known non-functional until a backend exists

These call a live API today and will silently no-op/fail without one — everything else (the whole LMS) runs on mock data in `src/pages/lms/mockData.ts` and needs nothing:

- `src/components/AIChatBox.tsx`, `src/components/SafetyAssistantChat.tsx` — marketing-site AI chat widgets.
- `src/_core/hooks/useAuth.ts` and `src/const.ts`'s `getLoginUrl()` — real sign-in for the marketing site's admin area (still points at Manus OAuth env vars that don't exist here).
- `src/pages/lms/admin/*`, `src/pages/lms/LMSClients.tsx`, `src/pages/lms/LMSCourseBuilder.tsx` (legacy, unlinked) — Super Admin panel, explicitly out of scope for the LMS redesign; still wired to live tRPC calls.
