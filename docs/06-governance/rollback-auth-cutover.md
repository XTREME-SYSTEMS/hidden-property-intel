# Auth cutover rollback

Before production:
1. Keep PR #38 draft.
2. Validate preview build and unauthenticated public routes.
3. Validate email sign-up/sign-in/reset in Supabase staging/preview context.
4. Validate Google callback only after provider credentials are configured.
5. Preserve current production deployment as rollback candidate.

Rollback:
- Do not merge PR #38 if preview auth validation fails.
- If a post-merge auth regression occurs, promote the last known-good Vercel production deployment.
- Supabase profile/membership tables are additive and can remain without affecting the old Base44 frontend.
- Do not delete Base44 users, functions, or secrets during this phase.
