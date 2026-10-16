# Opportunity Ledger 3.0

A Vercel-ready opportunity dashboard with a professional light design, company images, in-site detail guides, Kenya context, a featured slideshow, opening/deadline fields, bookmarks and keyword radar.

This version fixes the fixed-directory limitation: **new AI recruitment sources found by web discovery are saved as platform leads and added to both AI companies and All programs**. They are visibly distinguished from the reviewed starter directory.

## Update the website you already uploaded to GitHub

1. Extract the ZIP and open `opportunity-ledger/`.
2. Upload its contents into the **same paths** in your existing GitHub repository. Include `api/`, `lib/`, `public/`, `scripts/`, `package.json`, `package-lock.json`, `vercel.json` and `.env.example`. Upload the new company SVG assets too. Do not upload `node_modules/`, `dist/` or real `.env` files.
3. Commit to the production branch connected to your Vercel project. Vercel should build that commit automatically. Confirm the commit/deployment in Vercel's Deployments screen.
4. Add the four discovery settings below in **Vercel → Project → Settings → Environment Variables → Production**. Redeploy after adding or changing them.
5. Run the production daily job once from Vercel's **Cron Jobs** screen. Open **Discovery & coverage** on your website to inspect the recorded queries, failures and platform count.

Uploading the source changes the software. It does not create service accounts or activate web discovery without credentials. No service credentials were supplied for this project, and this update has not been deployed to your account.

For a new Vercel project: import the GitHub repository, select framework **Other**, install `npm ci`, build `npm run build`, output `dist`, and use Node.js **22.x or 24.x**. The repository root must contain `package.json`. Keep **Fluid Compute enabled**; scan functions have a 180-second maximum. Deploy the complete source, including API functions.

## Activate deeper discovery

| Required server setting | Where it comes from |
| --- | --- |
| `TAVILY_API_KEY` | Your [Tavily](https://app.tavily.com/) search API key |
| `UPSTASH_REDIS_REST_URL` | REST URL from your [Upstash Redis](https://console.upstash.com/) database |
| `UPSTASH_REDIS_REST_TOKEN` | REST token from the same database |
| `CRON_SECRET` | A long random secret you create; Vercel uses it to authenticate the job |

Generate a secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Keep keys and secrets on the server. Never put them in `public/`, in a GitHub commit, in a URL, or in a variable prefixed `VITE_` or `NEXT_PUBLIC_`.

Without these settings, the **32-company starter directory**, **56 program/company links**, **24 RSS streams**, state calendars, images, modals and slideshow remain available. Automatic platform expansion requires the configured search job. No fake discoveries are substituted when a service is unavailable.

The scheduled job runs daily at **06:00 UTC / 09:00 Nairobi** in production. Vercel Hobby may invoke within the scheduled hour. The cron route reuses a batch completed within the previous 23 hours to avoid duplicate scheduled spending. Extra owner-triggered batches use the separate protected route described below.

## What the deeper search actually does

The independent web-search plan contains **163 queries**:

| Search lane | Queries | Scope |
| --- | ---: | --- |
| AI employers and contributor platforms | 72 | 12 work types across 6 geographic focuses, including Kenya/East Africa, Africa, Europe, Asia, Latin America and worldwide |
| Other money opportunities | 40 | Remote work, scholarships, grants, refunds, benefits, settlements, paid research, competitions, offers and startup funding |
| State student aid | 51 | One FAFSA/state-aid search for every state and D.C. |

- Searches default to Tavily **advanced**, requesting up to **20 results per query** and available source text. Established-platform searches have **no publication-age cutoff**; opportunity updates use a one-month window.
- A saved cursor continues through the plan across batches, then starts another cycle. Queries are interleaved across AI, other money topics and student aid. At default settings a batch runs up to 24 queries; the whole plan is deliberately spread across runs.
- Recruitment links found in AI source text create follow-up searches. At most one quarter of a batch follows these leads, so the base plan keeps advancing. Follow-up backlog is capped at 500.
- Recruitment pages and root landing pages with relevant AI/intake signals can become **platform leads**. Blogs, common aggregators, social sites and roundups stay news/discovery material. Domain/ATS-employer identities are deduplicated; known starter platforms are not added again.
- Available source text can establish an automated recruitment/application signal. It **does not establish ownership, legitimacy, available paid assignments or Kenya acceptance**. Newly discovered cards have no reviewed-official-domain badge and retain explicit ownership-review guidance. No source text means intake remains unconfirmed.
- The registry retains up to **5,000 newly discovered platforms**, separately from the fixed starter records. Its cap is visible in coverage when reached. Discovered sources become eligible for recheck queries after seven days. An intake signal older than 14 days is displayed as needing a fresh review.
- Source failures retain earlier records. Search queries, result counts, failures, pending follow-ups, request budgets and last scan appear under **Discovery & coverage**. The progress counter reflects successful latest recorded checks for distinct base-plan queries; it does not mean every platform on the internet has been found.
- Public page loads, refreshes and search-box keystrokes only read collected data. They do not spend web-search credits. The company endpoint checks only reviewed starter URLs directly; discovered URLs are retrieved by the search provider during protected scans.

A successful query can return zero results. Source text can be missing or incomplete. Search and indexing do not cover every website, language, private group or signed-in task dashboard. Candidate selection is heuristic; review the source before relying on it. New leads use a local AI-work illustration, while the 32 starter companies have individual banners. Sixteen starter images come from official preview assets; sixteen are original company-name illustrations.

## Control search depth and spending

| Setting | Default | Behavior |
| --- | ---: | --- |
| `DEEP_SEARCH_LIMIT` | `24` | Queries per batch, range 1–48; set 48 for faster coverage |
| `SEARCH_DEPTH` | `advanced` | `advanced` or `basic` |
| `SEARCH_DAILY_LIMIT` | `96` | Requests across scheduled and extra batches per UTC day, range 1–480 |
| `SEARCH_MONTHLY_CREDIT_LIMIT` | `1600` | Conservative reserved search credits per UTC month, range 2–100000 |

Advanced search currently uses two credits per request; basic uses one. A default 24-query advanced batch reserves up to 48 credits. The local budget counts failed requests conservatively, even if the provider does not charge them. Requests are reserved in shared storage **before** calling search. Daily/monthly counters survive cold starts and extra invocations. When a budget is exhausted, further web searches pause while existing results and RSS remain available.

Set spending limits in your provider account too: these counters cover this deployment's requests, not other apps using your API key. The defaults are not a promise of free service. Consult the provider's current plan and credit pricing. Changing a limit only takes effect after redeployment.

### Run an extra deep batch now

The project includes an owner-only command. Install Node.js 22+, run `npm ci`, and use your actual production URL. Supply `CRON_SECRET` through your terminal environment or an ignored `.env.local` file. For Bash, you can enter it without echoing it:

```bash
read -r -s -p "Cron secret: " CRON_SECRET
export CRON_SECRET
npm run scan -- https://your-project.vercel.app
unset CRON_SECRET
```

Run again to advance another batch, within the shared daily/monthly limits. `npm run scan` calls `POST /api/scan` with bearer authentication. It uses the same scan lock and registry as cron, never sends email, and refuses redirects. A public visitor cannot trigger paid searches. No secret is requested or stored by the website. Allow a short edge-cache delay before refreshing company/news results.

`GET /api/discovery` returns read-only coverage metadata. `GET /api/companies` merges starter sources and retained discovered platforms. `GET /api/opportunities` returns RSS plus collected web discoveries. The shared news response retains at most 2,000 links; public feed refreshes retain recent discovery items. Company results are paginated in 128-record pages and collected by the client, so a growing registry does not require a single oversized Vercel response. Larger cache values are compressed. The independent platform registry lasts up to a year without a subsequent write and is refreshed by scheduled scans.

## Optional alerts

Preferences in the site control browser-local keywords, country focus, bookmarks, refreshes and browser notifications. Notifications require permission and an open page. These are not background push notifications.

For a daily email while the page is closed, additionally configure:

| Setting | Meaning |
| --- | --- |
| `RESEND_API_KEY` | Your [Resend](https://resend.com/) API key |
| `ALERT_EMAIL` | Your receiving address |
| `ALERT_FROM` | Sender/domain permitted by your Resend account |
| `ALERT_KEYWORDS` | Optional comma-separated terms; match any term, blank means all |
| `ALERT_CATEGORIES` | Optional comma-separated category IDs, blank means all |
| `ALERT_REGION` | Optional `US` or `KE` stream focus, blank means all |
| `SITE_URL` | Your deployed website URL for the email link |

Email also requires shared storage and `CRON_SECRET`. The daily job sends up to 20 unseen matching links, with delivery IDs retained for 90 days. Its settings are separate from browser preferences. An enabled email configuration is not proof of delivery; confirm it after deployment. No real email was sent during development. Remove the email key or recipient and redeploy to stop it.

Category IDs: `ai-work`, `remote-work`, `scholarships`, `grants`, `tax-refunds`, `benefits`, `settlements`, `research`, `competitions`, `deals`, `startup`.

## Dates, detail guides and Kenya

Every card displays an opening/start field and a closing/deadline field. Missing or ambiguous dates remain **Not published**. Publication and discovery times are kept separate. Explicit dates extracted from a source are labeled for confirmation. Platforms do not inherit a single global deadline from an unrelated job listing.

The reviewed **2027–28 FAFSA** calendar includes all 50 states and D.C., plus the federal cutoff. Its opening field describes the online federal form's September 23, 2026 launch. State priorities, final dates and funding-dependent programs are distinct. The federal cutoff is June 30, 2028; school deadlines can differ. The reviewed calendar is maintained separately from automated headlines.

Images, titles, sources and actions on cards open an in-site brief with dates, available story context, requirements, steps, source references, saving and Kenya guidance. The external source button opens the complete publisher story or application. Original contextual text and available excerpts do not claim to reproduce a complete publisher article.

Kenya guidance distinguishes reviewed location restrictions, conditional eligibility, role-specific listing signals and unconfirmed country/payout support. Use your own information and documents and confirm legitimate payout support with the provider. No application documents are collected by this site. Provider policy reviews from October 16, 2026 request fresh review after 30 days. Newly discovered platforms do not receive assumed Kenya approval. See `SOURCES.md` and `public/briefs.js` for references.

## Local development and verification

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Optional local settings belong in ignored `.env.local`. Double-clicking HTML or uploading only `dist/` will not run API discovery.

```bash
npm run check
npm test
npm run build
```

The project includes five Vercel API endpoints and a static dashboard. Main implementation files:

| File | Purpose |
| --- | --- |
| `public/app.js`, `index.html`, `styles.css` | Dashboard, card modals, coverage panel, filters and slideshow |
| `public/search-plan.js` | 163 interleaved search queries and lane counts |
| `lib/search.js`, `lib/platforms.js` | Protected search batches, persistence checkpoints, platform leads and follow-ups |
| `public/opportunity-data.js`, `public/catalog.js` | Starter companies, calendars, category/program directory and RSS streams |
| `api/cron.js`, `api/scan.js` | Daily scan/digest and protected extra web-search batch |
| `api/discovery.js`, `api/companies.js`, `api/opportunities.js` | Read-only progress, company and news data |
| `.env.example`, `vercel.json` | Server settings, function limits and production schedule |

Add or adjust search intents in `public/search-plan.js`; add monitored RSS sources in `public/catalog.js`. Rebuild and redeploy changes. There is no application login; optional Vercel deployment protection can restrict a personal site. Public responses contain collected opportunities and search evidence, not your API keys, email settings or device-local bookmarks.

See `VALIDATION.md` for what was actually tested and what still needs production verification.
