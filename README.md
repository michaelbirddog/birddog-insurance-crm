# BirdDog Insurance Partner CRM

Standalone React, Vite, TypeScript, Tailwind, and Convex CRM for BirdDog insurance carrier, MGA, broker, and program administrator outreach.

## Built

- Convex schema for partners, contacts, documents, and activity.
- Convex queries and mutations for CRUD, stage changes, seed data, activity logging, and file storage.
- Convex file storage upload flow with secure upload URL generation and download URLs via `ctx.storage.getUrl`.
- React single page app matching the original dark BirdDog mockup aesthetic: Fraunces headings, JetBrains Mono labels, Inter body, orange accent, stats strip, kanban, table, search, and modal profile cards.
- Rich partner profiles with appetite, products-to-write chips, structured contacts, claim process, rating process, economics, notes, documents, and activity.
- Idempotent seed mutation for the 13 mockup partners.

## Local development

Convex project provisioning requires interactive login. After creating the Convex project, run:

```bash
npm install
npx convex dev
npm run dev
```

Set `VITE_CONVEX_URL` in `.env.local`:

```bash
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

## Seed data

After Convex is connected:

```bash
npx convex run seed:seedPartners
```

The mutation only seeds when the partners table is empty.

## Build

```bash
npm run build
```

See `DEPLOY.md` for go-live steps.
