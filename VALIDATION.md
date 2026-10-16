# Professional edition — validation

Reviewed 16 October 2026.

## Completed

- `npm run check`: passed. Checked 22 JavaScript files, 22 company image cards and their local assets, 51 state/DC calendars, 46 program/company directory links, 24 discovery streams, and Vercel configuration.
- `npm test`: **64 checks passed; zero failures**. Coverage includes the company directory, image elements, both date fields on every card, the complete state selector, Texas priority timing, federal cutoff separation, unknown dates, slideshow next/previous/dots/pause/keyboard controls, saved collections, searching, preferences, state-aware news, unavailable sources, dates extracted from source text, XML safety, credential isolation, cron authorization and duplicate-email prevention.
- `npm run build`: passed. Produces the static dashboard; Vercel separately deploys the three API functions.
- The former background image was removed from source assets and no stylesheet references it.
- Company imagery: **16 official website social-preview images**, plus **6 original company-name illustrations**. The image manifest records each original URL and fallback. Two featured official images were visually inspected as image assets.
- Live RSS check at **2026-10-16 05:30:56 UTC**: **24/24 streams succeeded**, returning **600 links** at the configured response cap. The RSS excerpts in that sample did not supply explicit application start/end dates; the application calendar supplies its source-backed dates separately. Unknown news dates remain unknown.
- Live company-source check in the same run: **16/22 pages reached**, **13 unambiguous hiring/application signals**. The remaining pages were unavailable or needed review. Those counts describe that run, not a promise that every monitored company has a currently available role. The reviewed directory remains accessible during source failures.
- The scheduled pipeline was tested with mocked search, Redis and email responses; source text can supply opening/closing dates absent from a short snippet. No real email was sent and no search credits were spent.

## Date handling

The 2027–28 calendar uses the official Federal Student Aid state deadline table. Its start field points separately to the September 23, 2026 online FAFSA launch announcement. A state priority date is not presented as the federal cutoff or as an automatic end to all state applications. Program-specific exceptions are summarized on the card. States without one statewide closing date have an unknown or funding-dependent end field.

Article publication and discovery timestamps are never substituted for opening dates. Explicit dates require a year; invalid or ambiguous dates stay unknown. Source-extracted dates are labeled for confirmation, not represented as manually verified terms. Company-wide dates stay unknown when only individual jobs have their own application periods. Structured job posting dates are kept separate from the company's general intake window.

## Verification limits

A real browser layout/screenshot test was unavailable. Interactions were checked in a simulated DOM, responsive CSS is included, and image assets were inspected separately. Review the desktop and mobile layout after deployment.

The project has not been deployed into your Vercel account. Live Tavily, Redis and Resend credentials were not supplied; production credentials, cron invocation and email delivery must be confirmed after deployment. Some company pages block automated fetches or render their listings only with JavaScript. The monitor does not treat a generic careers landing page as proof of active hiring.

The calendar is explicitly for **2027–28**, last reviewed **October 16, 2026**. Source-backed calendar records must be maintained for amendments and new cycles. The news stream can discover new notices, but it does not silently overwrite the reviewed calendar using an unverified article. The company registry is broad and editable, not an exhaustive list of every AI company.

## Deployment review

1. Deploy the complete source to Vercel using the README settings; do not deploy only the static `dist/` folder.
2. Confirm the company collection displays images, the state calendar filters correctly, and the slideshow controls work on desktop and mobile.
3. Check `/api/opportunities` and `/api/companies` for actual source availability. Partial outages are expected to be reported honestly.
4. Configure optional search/cache/cron variables, redeploy, and run the daily job from Vercel's Cron Jobs screen.
5. If using email, add your verified sender and recipient, run the job, and confirm receipt. Browser-local filters and server-side email filters are separate.

## Version 2.1 checks

- Detail modals were tested from card action links, images, titles, featured slides and date buttons.
- The guide keeps publication and application dates separate, exposes explicit source buttons, supports bookmarking without closing, closes with Escape and restores focus to the opener. No identity/application form is present.
- Injected source markup is rendered as text in the modal. External links use HTTP(S) validation and `noopener noreferrer`.
- Kenya guidance tests cover U.S. location requirements, Outlier’s reviewed country restriction, unconfirmed Luel payout support, FAFSA eligibility categories, role-specific Kenya signals, stale reviews and lookalike source domains.
- Choosing Kenya-listed alternatives narrows company profiles to reviewed role-specific signals. It does not assert individual eligibility. No location bypass or false-identity workflow is implemented.
- Story expansion uses the available source excerpt plus original contextual guidance. It does not claim complete publisher article text, independently confirmed personal eligibility or a guaranteed payment.

Browser layout was not newly verified in a real browser; modal behavior was exercised in the simulated DOM. The update does not change existing cron, cache, search-key or email deployment requirements.
