# South Ken Live

London's current temperature plus live train departures, platform boards and line status for South Kensington tube station (District, Circle, Piccadilly).

- `public/index.html` — the page (auto-refreshes trains every 20s, weather every 5 min, live countdowns)
- `api/arrivals.js` — serverless proxy to the TfL Unified API (stop `940GZZLUSKS`)
- `api/weather.js` — serverless proxy to Open-Meteo (no key needed)

## Deploy

**Option A – CLI**
```bash
npm i -g vercel
cd south-ken-live
vercel        # preview
vercel --prod # production
```

**Option B – GitHub**
Push this folder to a GitHub repo, then on vercel.com choose *Add New → Project*, import the repo and click *Deploy*. No build settings needed.

## Optional: TfL API key
The TfL API works without a key but is rate-limited. For reliability, register a free key at https://api-portal.tfl.gov.uk and add it in Vercel → Project → Settings → Environment Variables as `TFL_APP_KEY`.

## Run locally
```bash
vercel dev
```
