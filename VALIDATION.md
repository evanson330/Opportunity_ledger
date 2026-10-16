# Version 3.0 validation

Reviewed October 16, 2026.

## Completed for this update

- `npm run check`: passed. 29 JavaScript files, 32 company image cards/local assets, 51 state/DC calendars, 56 starter source links, 24 RSS streams, 163 distinct web queries and Vercel configuration.
- `npm test`: **83 checks passed, zero failures**. Includes prior calendar, card, modal, Kenya guidance, slideshow, bookmark, RSS, source-failure and email-idempotency behavior.
- Added checks cover rotating the entire plan across batches, source-text requirements, unknown ownership and country support, domain and ATS tenant deduplication, follow-up scheduling, stale-source rechecks, retained platforms, daily/monthly limits, reservations before spending, rejected checkpoints, protected extra scans, compressed large-registry storage, bounded company pagination, one-query batch fairness, lock contention, persistent cursor progress and read-only coverage without secrets.
- Dashboard interactions were exercised in a simulated DOM. New tests verify visible coverage and query evidence, a discovered platform appearing in both collections, its image, review labels and detail modal.
- `npm run build`: passed. Static dashboard in `dist/`; Vercel separately deploys five API functions. Cron/extra scans allow 180 seconds with Fluid Compute; their shared lock expires after 240 seconds.
- New starter source URLs were researched through official pages. Ten additional company-name banners are original SVG illustrations. Existing sixteen official preview images are retained, making 32 starter image cards total. Discovered leads use a local category illustration.
- Search/Redis/email integration was tested with mocked provider responses. Extra batches advance the shared cursor without sending email. Public page refreshes never invoke paid search.

## Live checks and remaining limits

A direct-fetch check of the ten additional starter URLs at **2026-10-16 06:42:46 UTC** reached four pages and found four intake signals (Neevo, TaskVerse, Turing and Toloka careers). Six sources were unavailable to that automated fetch; their directory records remain marked for review. Search-engine access and direct HTTP access can differ.

No Tavily, Redis or Resend credentials were supplied. Live advanced-search quality, provider quota behavior, production Redis persistence, Vercel scheduling and delivery must be confirmed after deployment. No search credits were spent and no real email was sent during this update. The code has not been deployed into the user's Vercel account.

A real-browser layout/screenshot test was unavailable. Interaction tests use a simulated DOM; desktop and mobile layout need inspection after deployment. Image and CSS changes do not constitute a verified browser render.

The prior version's live RSS check on October 16 at 05:30:56 UTC reached 24/24 streams and returned 600 links at its cap. Its prior 22-company check reached 16 pages and found 13 intake signals. Those are historical sample results, not current source availability or a live test of the new 163-query service.

Candidate platform selection is heuristic. Retrieved source text and an application signal do not prove ownership, legitimacy, personal eligibility, live paid work or Kenya support. New cards explicitly require review and have no reviewed-official badge. Generic signup without source text remains unconfirmed; a negative hiring notice overrides a generic application signal. Existing platforms and ATS tenants are deduplicated; rebrands, multiple domains and aliases can still require manual cleanup.

Search providers do not index the whole internet. The registry retains at most 5,000 platform leads and queues at most 500 follow-ups. At least three quarters of a batch advance the base plan when follow-ups are pending. Default daily scheduling covers the complete base plan across multiple days; it does not execute 163 queries at every page load. Budget reservations include failed provider requests and may exceed actual charged credits. Provider-level spending caps remain necessary for keys used elsewhere.

Company-wide dates remain unknown when only a particular job has a date. Calendar records remain the reviewed 2027–28 cycle and are not silently changed using unverified headlines. Kenya-specific policy guidance remains dated, source-backed and separate from automatic country-focus queries.

## Deployment verification

1. Upload all revised source files and assets to the connected production branch, then confirm the deployed commit in Vercel.
2. Confirm card images, detail guides, the slideshow and the new coverage panel on desktop/mobile.
3. Add the four discovery variables, redeploy and run the production cron job once.
4. Inspect `/api/discovery`: `ready` should be true; `lastRun`, completed query counts, results/failures and saved platform count should reflect actual execution. Configuration alone does not prove a successful scan.
5. Run `npm run scan -- https://your-site.vercel.app` from an owner terminal with `CRON_SECRET` in the environment to advance another batch. Confirm the cursor increases and discovered platforms appear after the short edge-cache delay.
6. Check source failures and provider/account limits. If email is enabled, confirm receipt separately; extra web-search batches never send email.
