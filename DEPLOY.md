# Deploy BirdDog Insurance Partner CRM

This repo is complete, but Convex and Vercel project provisioning require interactive credentials that are not available in this machine session. Do not run interactive login from the agent.

## 1. Clone and install

```bash
git clone https://github.com/michaelbirddog/birddog-insurance-crm.git
cd birddog-insurance-crm
npm install
```

## 2. Create Convex project

Run this locally or in a shell where you can complete the browser/device login:

```bash
npx convex dev
```

When prompted:

- Create a new project named `birddog-insurance`.
- Let Convex write `.env.local`.
- Confirm `VITE_CONVEX_URL` is present in `.env.local`.

Keep this process running until Convex finishes pushing the schema and functions.

## 3. Seed the CRM

In a second terminal from the repo root:

```bash
npx convex run seed:seedPartners
```

Expected result on first run:

```json
{ "seeded": true, "count": 13 }
```

Expected result on later runs:

```json
{ "seeded": false, "count": 0, "reason": "partners table is not empty" }
```

## 4. Production Convex deploy key

Create a production deploy key in the Convex dashboard for the `birddog-insurance` project. Then deploy without interactive login:

```bash
export CONVEX_DEPLOY_KEY="<convex deploy key>"
npx convex deploy --cmd 'npm run build'
```

Capture the production Convex URL, it looks like:

```bash
https://<deployment>.convex.cloud
```

## 5. Vercel deploy

Option A, Vercel dashboard:

1. Import `https://github.com/michaelbirddog/birddog-insurance-crm`.
2. Framework preset: Vite.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Environment variable: `VITE_CONVEX_URL=https://<deployment>.convex.cloud`.
6. Deploy.

Option B, Vercel CLI with a token:

```bash
export VERCEL_TOKEN="<vercel token>"
vercel link --yes --project birddog-insurance-crm --token "$VERCEL_TOKEN"
vercel env add VITE_CONVEX_URL production --token "$VERCEL_TOKEN"
vercel deploy --prod --token "$VERCEL_TOKEN"
```

When prompted for the env var value, paste the production Convex URL.

## 6. Verify production

```bash
curl -I https://<vercel-app-url>
npx convex run seed:seedPartners
```

Open the Vercel URL and verify:

- Stats show 13 total partners after seed.
- Kanban drag changes stage and logs a Stage Change activity.
- Partner modal saves rich fields.
- Contact rows can be added, edited, and deleted.
- Document upload stores files in Convex and download links work.
