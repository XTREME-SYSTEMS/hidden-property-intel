import { json, requireSupabaseUser, serviceQuery, SITE_KEY } from "../_lib/googleWorkspace.js";

export default async function handler(req,res) {
  try {
    if (req.method !== "GET") return json(res,405,{error:"method_not_allowed"});
    const user=await requireSupabaseUser(req);
    const rows=await serviceQuery(
      `universal_google_workspace_connections?select=google_account_email,scopes,status,access_expires_at,connected_at,updated_at&user_id=eq.${encodeURIComponent(user.id)}&site_key=eq.${SITE_KEY}&limit=1`
    );
    return json(res,200,{connection:rows?.[0]||null});
  } catch(error) {
    return json(res,error.status||500,{error:error.message||"google_oauth_status_failed"});
  }
}
