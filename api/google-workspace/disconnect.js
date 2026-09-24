import { json, requireSupabaseUser, serviceQuery, SITE_KEY } from "../_lib/googleWorkspace.js";

export default async function handler(req,res) {
  try {
    if (req.method !== "POST") return json(res,405,{error:"method_not_allowed"});
    const user=await requireSupabaseUser(req);
    await serviceQuery(
      `universal_google_workspace_credentials?user_id=eq.${encodeURIComponent(user.id)}&site_key=eq.${SITE_KEY}`,
      {method:"DELETE",headers:{Prefer:"return=minimal"}}
    );
    await serviceQuery(
      `universal_google_workspace_connections?user_id=eq.${encodeURIComponent(user.id)}&site_key=eq.${SITE_KEY}`,
      {method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({status:"revoked",credential_ref:null,updated_at:new Date().toISOString()})}
    );
    return json(res,200,{disconnected:true});
  } catch(error) {
    return json(res,error.status||500,{error:error.message||"google_oauth_disconnect_failed"});
  }
}
