# The Opportunity Ledger

A personal opportunity news desk designed around your honeycomb background. It covers AI tasks and jobs (including Handshake and Luel), remote work, scholarships and FAFSA, grants, refunds, benefits, settlement claims, paid research, competitions, cashback, and business funding.

## Deploy to your Vercel

1. Extract this ZIP. Upload the **contents of `opportunity-ledger/`** to a new GitHub repository. `package.json`, `vercel.json`, `public/`, `api/`, and `lib/` must be at the repository root. Include `package-lock.json`. Do not upload `node_modules/` or any real `.env` file.
2. In Vercel, choose **Add New → Project**, import that repository, and select **Other** as the framework. Root Directory: the folder containing `package.json`. Build command: `npm run build`. Output Directory: `dist`. Install command: `npm ci`. Use Node.js **22.x or 24.x**. Keep **Fluid Compute** enabled for the configured function durations.
3. Deploy. The design, directory, live RSS reader, search/filter controls, bookmarks, and keyword radar work without search API credentials. The first scan can take approximately 10–30 seconds; later requests use a cache. The public API must remain deployed along with the static files; uploading only `dist/` will not run discovery.
4. For the broader daily search, add the four variables in the table below under **Project → Settings → Environment Variables → Production**. Redeploy after changing environment variables.
5. For email while the site is closed, also add the email variables. After deployment, open Vercel's **Cron Jobs** settings and run the job once to confirm the connected services work. Later runs follow `vercel.json`.

You can alternatively deploy the extracted project from its folder using the official Vercel CLI: `npx vercel`, then `npx vercel --prod`. Complete authentication in your own terminal. The project is prepared for your account; it has not been published for you.

## Choose how much to connect

| Mode | Environment variables | Result |
| --- | --- | --- |
| Live RSS and directory | None | 17 monitored RSS streams, 30 source links, filters, bookmarks, and keyword matches while browsing. Cache lives in the current server instance. |
| Daily refresh and shared cache | `CRON_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Saves daily RSS results across function instances. |
| Broader daily web discovery | All shared-cache variables plus `TAVILY_API_KEY` | Up to 15 fixed web queries per daily sweep, up to 10 results per query, in addition to RSS. |
| Personal daily email | Shared-cache variables plus `RESEND_API_KEY`, `ALERT_EMAIL`, `ALERT_FROM` | Sends up to 20 newly discovered matches to your configured address. Works with RSS alone or RSS plus web discovery. |

Create a Redis database at [Upstash](https://console.upstash.com/), a search key at [Tavily](https://app.tavily.com/), and an email key at [Resend](https://resend.com/). Existing accounts work. These services can have quotas or charges; check their current plans and set provider spending limits. The site does not make paid search requests when someone simply opens or refreshes it. Paid discovery runs only through the secret-protected scheduled route.

`CRON_SECRET` should be a long random string (at least 32 characters recommended). Generate one locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Vercel sends it as the cron request's bearer token. Never put it or any API key in `public/`, a browser preference, a GitHub commit, or a variable prefixed `VITE_`/`NEXT_PUBLIC_`.

For Resend, `ALERT_FROM` must use a sender/domain allowed by your Resend account, e.g. `Opportunity Ledger <briefing@yourdomain.example>`. Set `ALERT_EMAIL` to **your** receiving address. Optional `SITE_URL` links the digest back to the deployed website. Email setup is only considered configured when the sender, recipient, key, cache, and cron secret are all present; the first run is the delivery check. No email has been sent during creation of this project.

The daily job is set to **06:00 UTC (09:00 Africa/Nairobi)**. Vercel Hobby supports daily scheduling and may invoke within the scheduled hour. Schedules run in production, not on an ordinary preview deployment. Until shared cache is configured, the scheduled endpoint returns a setup error; normal RSS browsing still works. If you want only on-demand RSS, remove the `crons` entry from `vercel.json`.

## Personalize alerts

In the website's **Preferences**, edit watched keywords, choose a default country focus, and turn auto-refresh or browser notifications on/off. Bookmarks, keywords, and preferences belong to the current browser/device. Browser notifications require permission and an open page; mobile support varies. They are not background push notifications.

Email has separate server-side preferences so it can work with the page closed:

| Variable | Example | Meaning |
| --- | --- | --- |
| `ALERT_KEYWORDS` | `Handshake,Luel,FAFSA,tax refund` | Match any term in the title, snippet, or source. Blank = all. |
| `ALERT_CATEGORIES` | `ai-work,scholarships,tax-refunds` | Restrict to selected category IDs. Blank = all. |
| `ALERT_REGION` | `US` or `KE` | Restrict to that stream's country focus. Blank = all, including country-varies results. |
| `DEEP_SEARCH_LIMIT` | `8` | Limit daily query count. Default 16; there are currently 15 searchable queries. |

Category IDs: `ai-work`, `remote-work`, `scholarships`, `grants`, `tax-refunds`, `benefits`, `settlements`, `research`, `competitions`, `deals`, `startup`.

Filters combine: category AND country AND any keyword. Newly discovered does not mean newly published or definitely open. Missing publication dates are explicitly labeled. The first email sends up to 20 matching links; subsequent runs send unseen matches. Seen IDs are retained for 90 days. Removing `ALERT_EMAIL` or `RESEND_API_KEY` and redeploying stops email.

## How discovery works

- Fifteen Google News RSS queries watch the categories and named AI platforms. Two direct feeds watch We Work Remotely jobs and relevant FTC announcements.
- RSS scans are cached for 30 minutes. Vercel's edge cache may serve a result for a few additional minutes. The browser checks every ten minutes while open, if enabled. The refresh button retrieves the latest cached briefing; it does not bypass cache limits or spend search credits.
- A configured cron job runs broader Tavily searches with bounded concurrency, one query per search stream, and a daily sweep guard. Missing keys do not create fake news. Failed upstream sources are reported.
- Redis preserves a shared briefing, search results, cron locking, and email delivery history. RSS discovery still works without Redis, with instance-local caching.
- URLs and syndicated titles are deduplicated, tracking parameters are normalized, untrusted markup is escaped, malformed dates stay unknown, and dated RSS stories older than 31 days are dropped. A basic relevance filter removes gambling promotions and guaranteed-return pitches; it is not a comprehensive fraud detector.
- Official-domain labels identify a government or known program domain, not a verified job opening, guaranteed award, or approved personal eligibility.
- Country labels describe the discovery stream's focus. `varies` means requirements need checking, not that everyone worldwide is eligible. Handshake's U.S. work authorization requirement is called out. FAFSA is U.S. financial aid; completing a form does not itself guarantee a payment. No sensitive application information is collected.

This monitors a broad collection of public sources. It cannot monitor every place where money is involved, access private task dashboards, establish eligibility, file applications, or promise that a program remains open. News reports may describe changes rather than an immediately claimable offer. Every item links out for review.

## Run on your computer

Install Node.js 22 or newer, open a terminal in this folder, then run:

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. For local optional features, copy `.env.example` to `.env.local` and fill only the variables you need. The development server loads that file; Vercel production uses its project environment variables. Opening `index.html` by double-clicking it will not run server functions.

```bash
npm run check
npm test
npm run build
```

## Project map

| File | Purpose |
| --- | --- |
| `public/index.html`, `styles.css`, `app.js` | Responsive dashboard and browser interactions |
| `public/assets/honeycomb.png` | Your original uploaded background, unchanged |
| `public/catalog.js` | Categories, source directory, and discovery queries |
| `api/opportunities.js` | Public read-only news endpoint; never calls paid search |
| `api/cron.js` | Protected scheduled discovery and personal digest |
| `lib/` | Feed parsing, search, persistence, alert selection, and delivery |
| `vercel.json` | Vercel build, function limits, daily cron, and security headers |
| `.env.example` | Environment variable reference, without credentials |
| `test/` | Automated behavior checks with mocked search/email providers |

To watch more sources, add a fixed RSS stream or query in `public/catalog.js`, rebuild, and redeploy. The keyword search field searches collected results; it does not issue a new unrestricted web query for every keystroke. To change the title or colors, edit `public/index.html` and the CSS variables in `public/styles.css`.

If this is only for personal use, you can enable your chosen Vercel deployment-access protection. There is no application login in this version. The public API exposes the shared news briefing, not your email, API credentials, or browser-local bookmarks.

## Verification

See `VALIDATION.md` for actual checks, limitations, and a deployment checklist. Implementation references are in `SOURCES.md`.
