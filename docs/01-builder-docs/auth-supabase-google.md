# HPI Supabase Auth + Google migration

## Authority
- Production host: Vercel, Strategic Minds Advisory.
- Identity authority: Universal Property Intelligence Supabase project `fwtchbsebygwifmmqhur`.
- Transitional data/functions: Base44 remains behind the Vercel frontend until migrated lane by lane.

## Frontend auth
The shared `base44` client exposes a compatibility auth facade backed by Supabase Auth. Existing frontend calls such as `base44.auth.me()` now resolve to Supabase without changing entity/function calls.

Supported:
- email/password sign-in
- sign-up + email confirmation
- Google social sign-in
- recovery email + password reset
- session refresh
- logout
- profile role lookup from `universal_user_profiles`

## Google social sign-in external configuration
Required in Google Auth Platform:
- Web OAuth client.
- Authorized JS origins:
  - https://hiddenpropertyintel.com
  - https://www.hiddenpropertyintel.com
- Authorized redirect URI:
  - https://fwtchbsebygwifmmqhur.supabase.co/auth/v1/callback

Required in Supabase Auth:
- Site URL: https://www.hiddenpropertyintel.com
- Additional redirect URLs:
  - https://hiddenpropertyintel.com/auth/callback
  - https://www.hiddenpropertyintel.com/auth/callback
  - preview callback URLs only when explicitly approved for testing
- Google provider enabled with the Web Client ID and Client Secret.

## Google Workspace OAuth
Workspace authorization is separate from Google sign-in. Do not reuse an identity token as a Drive/Gmail/Calendar credential.

Planned server-side env:
- GOOGLE_WORKSPACE_CLIENT_ID
- GOOGLE_WORKSPACE_CLIENT_SECRET
- GOOGLE_WORKSPACE_REDIRECT_URI
- GOOGLE_WORKSPACE_STATE_SECRET

Use least-privilege scopes per workflow. Persist only a secure credential reference in `universal_google_workspace_connections`; do not store raw refresh tokens in source control or browser storage.
