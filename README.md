# ⏱️ TimeTracker

A modern, MSP-style **personal time tracker** for IT consulting. Log billable
work with detailed notes, run a live timer, and get **weekly, bi-weekly,
monthly, quarterly, and yearly** reports. Sign in with Google to back up and
sync your data to the cloud — or use it instantly with no account at all (data
stays in your browser).

Built with React + Vite + TypeScript + Tailwind, with Firebase Auth + Firestore
for sync. Designed to host **for free** on Cloudflare Pages (or Firebase
Hosting, Netlify, Vercel, GitHub Pages — it's just a static site).

---

## ✨ Features

- **MSP-style time entries** — client, project, task, ticket #, billable flag,
  hourly rate, tags, and detailed work notes.
- **Live timer** — type what you're working on, hit start, and stop it later to
  log the time automatically.
- **Two entry modes** — log a duration (hours/minutes) or a start/end time range.
- **Reports for every period** — weekly, bi-weekly, monthly, quarterly, yearly,
  with billable hours, revenue at your rates, trend charts, and breakdowns by
  client and project.
- **History & search** — filter by client, billable status, or full-text search.
- **CSV export** — per-period or full export for invoicing/backup.
- **Google sign-in + cloud sync** — your entries follow you across devices.
- **Works offline / local-only** — no setup required to start; syncs when you sign in.
- **Modern dark UI** — responsive, works great on desktop and mobile.

---

## 🚀 Quick start (local development)

Requires Node.js 18+.

```bash
npm install
npm run dev
```

Open the printed URL (usually http://localhost:5173). The app works immediately
in **local-only mode** — data is saved in your browser. To enable Google
sign-in and cloud sync, configure Firebase below.

---

## ☁️ Enable cloud sync (Firebase) — free tier

1. Go to the [Firebase Console](https://console.firebase.google.com/) and
   **create a project** (free "Spark" plan is plenty).
2. **Add a Web app**: Project Overview → the `</>` icon → register the app.
   Copy the `firebaseConfig` values it shows you.
3. **Enable Google sign-in**: Build → Authentication → Get started →
   Sign-in method → enable **Google**.
4. **Create Firestore**: Build → Firestore Database → Create database →
   start in **production mode**.
5. **Set security rules**: Firestore → Rules tab → paste the contents of
   [`firestore.rules`](./firestore.rules) (this restricts every user to their
   own data) → Publish.
6. **Add your config locally**: copy `.env.example` to `.env` and fill in the
   values from step 2:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_FIREBASE_API_KEY=AIza...
   VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project
   VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abc123
   ```

7. Restart `npm run dev`. Click **Sign in** — done. Any entries you made in
   local mode are automatically uploaded the first time you sign in.

> The `VITE_FIREBASE_*` values are **public client keys** — they're meant to ship
> in the frontend bundle. Your data is protected by the Firestore security
> rules, not by hiding these keys.

---

## 🌐 Deploy free on Cloudflare

This repo ships a [`wrangler.jsonc`](./wrangler.jsonc) that serves `dist/` as
static assets with single-page-application fallback, so it deploys cleanly to
**Cloudflare Workers** (the modern static-assets pipeline).

### Option A — Connect to Git (recommended)

1. Push this repo to GitHub (already done if you're reading this there).
2. In the [Cloudflare dashboard](https://dash.cloudflare.com/) →
   **Workers & Pages** → **Create** → **Import a repository** → pick this repo.
3. Build settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - (Output is `./dist`, already declared in `wrangler.jsonc`.)
4. Add your `VITE_FIREBASE_*` values as **build environment variables**.
   > These are baked into the bundle at build time, so they must be present
   > when `npm run build` runs.
5. **Deploy.** You'll get a free `*.workers.dev` URL.
6. **Authorize the domain in Firebase**: Authentication → Settings →
   **Authorized domains** → add your deployed domain (and any custom domain).
   Google sign-in popups only work from authorized domains.

### Option B — Deploy from your machine

```bash
npm run deploy   # runs `npm run build` then `wrangler deploy`
```

> **Why not a `_redirects` file?** The Workers asset pipeline rejects the
> classic SPA catch-all (`/* /index.html 200`) as an infinite-loop risk.
> Instead, SPA fallback is configured via `"not_found_handling":
> "single-page-application"` in `wrangler.jsonc`. (This app uses state-driven
> views on a single route, so a hard refresh always lands correctly anyway.)
>
> Prefer classic **Pages**, Netlify, Vercel, Firebase Hosting, or GitHub Pages?
> It's just a static bundle in `dist/` — point any of them at `npm run build`
> with output dir `dist`.

---

## 🧱 Project structure

```
src/
  components/    UI: Dashboard, EntriesView, ReportsView, SettingsView, modal, etc.
  hooks/         useAuth, useEntries (local + Firestore), useTimer, useSettings
  lib/
    firebase.ts  Firebase init (no-ops gracefully when unconfigured)
    reports.ts   Period ranges + aggregation for all report types
    time.ts      Date/duration/money formatting helpers
    types.ts     TimeEntry + settings types
    local.ts     localStorage persistence
firestore.rules  Per-user security rules to paste into Firebase
```

## 📜 Scripts

| Command           | What it does                          |
| ----------------- | ------------------------------------- |
| `npm run dev`     | Start the dev server                  |
| `npm run build`   | Type-check and build to `dist/`       |
| `npm run preview` | Preview the production build locally  |

---

## 🔐 Privacy

With Firebase configured, each entry is stored under
`users/{your-uid}/entries/{id}` and the security rules ensure only you can read
or write it. Without Firebase, nothing ever leaves your browser.
