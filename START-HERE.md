# Opportunity Ledger 3.0 — update and activate

This fixes the fixed platform list. New recruitment sources discovered by the search engine are retained and added to your company cards.

1. Extract the ZIP. Upload the contents of `opportunity-ledger/` into the same paths in your existing GitHub repository, including all new `api/`, `lib/`, `public/` and asset files.
2. Commit to the Vercel-connected production branch. Confirm Vercel builds that commit. Framework Other; install `npm ci`; build `npm run build`; output `dist`; Node 22 or 24; Fluid Compute enabled.
3. Add these **Production environment variables in Vercel** and redeploy:
   - `TAVILY_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `CRON_SECRET`
4. Run the production cron job once from Vercel's Cron Jobs screen.
5. Open **Discovery & coverage** on the website. It shows completed queries, new platform leads, pending follow-ups, failures and budgets. Search automatically continues daily at 09:00 Nairobi.

The 163-query plan covers 72 AI platform searches, 40 other money searches and 51 state/DC aid searches. Default batches run 24 advanced queries, up to 20 results each. Recruitment links create follow-up searches. Set `DEEP_SEARCH_LIMIT=48` for faster coverage, within your chosen provider budget. The README explains extra owner-triggered batches and spending controls.

The site also immediately includes **32 company image cards**, **56 program/company links**, **24 news streams**, state calendars, full detail guides with Kenya context and a slideshow.

Uploading files alone does not activate the web-search service. Until service credentials and cron are configured, the starter directory and RSS work; the coverage panel reports that deep discovery needs setup. Newly found leads require ownership/location review. Search cannot guarantee every platform or private opportunity worldwide.

Full instructions: `README.md`. Credentials stay out of GitHub and the browser. This package has not been deployed into your Vercel account.
