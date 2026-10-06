# Google Workspace OAuth on Vercel

This is separate from Google Sign-In through Supabase Auth.

## Vercel server routes
- POST /api/google-workspace/start
- GET /api/google-workspace/callback
- GET /api/google-workspace/status
- POST /api/google-workspace/disconnect

The start/status/disconnect routes require a valid Supabase user bearer token.
The callback is protected by a signed, expiring OAuth state.

## Server-only required environment
- HPI_SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_WORKSPACE_CLIENT_ID
- GOOGLE_WORKSPACE_CLIENT_SECRET
- GOOGLE_WORKSPACE_STATE_SECRET
- GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY
- GOOGLE_WORKSPACE_REDIRECT_URI (defaults to https://www.hiddenpropertyintel.com/api/google-workspace/callback)
- GOOGLE_WORKSPACE_SCOPES (optional)

GOOGLE_WORKSPACE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.
Never expose these as VITE_ variables.

## Default least-privilege scopes
- openid
- email
- profile
- https://www.googleapis.com/auth/drive.file
- https://www.googleapis.com/auth/calendar.events

Add Gmail, Contacts, Search Console, or broader Drive scopes only when the feature using them is ready and approved.

## Google Auth Platform
Create a Web OAuth client and authorize:
- origin https://hiddenpropertyintel.com
- origin https://www.hiddenpropertyintel.com
- redirect https://www.hiddenpropertyintel.com/api/google-workspace/callback

This Workspace OAuth client may be the same Google Cloud project as the Supabase Google-login client, but its redirect/scopes are distinct.
