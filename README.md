# PO-TRADE COSMOS COACH — Secure Responsive Fix

Responsive, bilingual trading journal with a local rule-based journal coach.

## Install
Upload the **contents** of this folder to the site's existing document root, keeping the directory structure. Take a backup first. Keep `sync.js` and `banner-config.js`; the design and AI coach CSS/JS files are required. After deployment, clear browser/site cache and unregister/refresh the prior PO-TRADE Service Worker so the new cache version activates.

For unique usernames and the opt-in, privacy-filtered leaderboard, run `PO-TRADE-SERVER-SETUP.sql` once in Supabase Dashboard → SQL Editor. This SQL is outside the site folder in the ZIP; do **not** upload it to the website host. The local coaching assistant stores chat history only in this browser's local storage and does not send prompts to an external AI API.

The sync code keeps pending changes until each cloud operation succeeds, retries with backoff, and reports pending work through `window.PT_Sync.status()`. Local-storage quota errors and cloud sync errors can still happen; export a JSON backup before destructive operations. If the SQL reports duplicate legacy usernames, trades, or settings, inspect them manually after a database backup. The migration intentionally does not auto-delete duplicate records.

The weekly leaderboard shows only people who opt in and reveals each statistic only when the matching visibility option is enabled. It returns aggregates only; individual trades, notes, screenshots, and strategy names are not returned by the public profile RPCs.

The coach is a local, rule-based analysis of the journal, with 150 bilingual behavior keywords and 150 original educational reminders. It is not a remote generative model and does not predict future trading results. The live trade terminal and live market charts remain placeholders until broker/chart integrations are connected; the copy-trade Explore feed supports opt-in public posts and community interactions after the SQL migration is installed.

## Security note
Database Row Level Security and owner-scoped policies protect `trades` and `user_settings`; the browser bundle contains only the public Supabase anon key and must never contain a `service_role` key. SQL and front-end changes cannot guarantee protection against volumetric DDoS: configure provider-side rate limits and a host/CDN WAF, keep the Supabase project up to date, and review access logs.


## COSMOS Dock Drawer v3
- The bottom dock now uses inline SVG icons and an animated contextual drawer for every section.
- Selecting a section reveals relevant routes; selecting a route then opens the full page.
- Mobile labels and hit areas are tuned for six items across narrow screens.
- The drawer is generated locally by index.html and adds no network dependency.


## Copy-trade Explore (2026-10)
- The Copy-trade page contains weekly PnL leaderboard + username search. Explore is a separate page with Latest, Popular and Following feeds, public trader profiles, follows, profile photos/bio, post count, likes, saves, comments and sharing.
- Existing community installation: run `PO-TRADE-COMMUNITY-UPGRADE.sql` only. Fresh setup: run `PO-TRADE-COMMUNITY-FULL-SETUP.sql` once. Do not run both. Back up first.
- Public posting requires a unique username, explicit leaderboard/community opt-in and username visibility. Private trades are never sent to the feed.
- Profile avatars and post images use private Storage buckets and short-lived signed URLs (avatar max 2 MB; post image max 5 MB; JPG/PNG/WebP). The post is public only when the author opts in; private journal trades are never published.

## Main navigation
- Five primary groups: Journal, Copy trade, Trade, Assistant, Settings. Calendar/history are under Journal and Charts are under Trade. Explore and public trader profiles are independent pages reached from Copy trade and post/leaderboard links.
- Live broker execution and live chart integration are not enabled by this UI-only release.
