# PropertyIntel — Investor Enhancement Log

Autonomous build tracker. Status: ✅ shipped · 🚧 core built · 📋 logged (deferred).

## Tier 1 — Highest ROI (built this pass)
1. ✅ **Real-time deal alerts** — `DealAlert` entity + `matchAndNotifyAlerts` function + `Deal Alert Matcher` workflow (entity trigger on Property create) + in-app alerts bell + `/alerts` page + `AlertPreference` (email/push/sms). Fires the moment a scraped property matches a saved search.
2. ✅ **Investor deal pipeline / portfolio tracker** — `Deal` entity (lead → underwriting → offer → contract → closing → rehab → exit) + `/investor/pipeline` Kanban + portfolio P&L summary.
3. ✅ **Exit-strategy modeling (Flip / BRRRR / Buy-Hold / Wholesale)** — `ExitStrategyModel` component with ARV, rehab, holding costs, DSCR, cap rate, cash-on-cash, IRR. On property detail + calculators.
4. ✅ **One-click investor brief (PDF)** — `PropertyBrief` component (jsPDF) generating a branded per-property report.
5. ✅ **Watchlist + deal heat** — `Watchlist` entity + `WatchButton` on listings/detail; bid-count heat indicator.
6. ✅ **Automated lien / title-risk check** — `TitleRisk` entity, generated in the nightly scoring pipeline via LLM.

## Tier 2 — Strong differentiators (logged; build on request)
7. 📋 **Rehab project manager** — post-close budget vs actual, contractor milestones, before/after photos.
8. 📋 **Hard-money / DSCR lender marketplace** — lender matching + pre-approval letters.
9. 📋 **Wholesale assignment flow** — assign contracts to other investors on-chain.
10. 📋 **Block-level micro-market analytics** — rent comps, schools, crime, STR projections per neighborhood.

## Tier 3 — Account-level / enterprise (logged; build on request)
11. 📋 **Team / multi-user accounts** — shared pipeline, role-based access, per-member activity.
12. 📋 **API access for Elite** — pull listings/scores into external models.
13. 📋 **Investor reputation & verification** — verified-buyer badges, closing history, seller reviews.

## Validation
- `validateSystem` extended to check new subsystems (alerts, pipeline, title-risk, watchlist, exit-model).
- Nightly 4 AM ET auto-heal workflow already schedules `validateSystem`.