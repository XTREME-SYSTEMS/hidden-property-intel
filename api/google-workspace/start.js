import crypto from "node:crypto";
import { googleConfig, json, requireSupabaseUser, safeReturnTo, signState, SITE_KEY } from "../_lib/googleWorkspace.js";

export default async function handler(req,res) {
  try {
    if (req.method !== "POST") return json(res,405,{error:"method_not_allowed"});
    const user=await requireSupabaseUser(req);
    const cfg=googleConfig();
    const state=signState({
      uid:user.id,
      site:SITE_KEY,
      nonce:crypto.randomBytes(16).toString("hex"),
      returnTo:safeReturnTo(req.body?.returnTo || "/admin"),
      exp:Date.now()+10*60*1000,
    });
    const url=new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id",cfg.clientId);
    url.searchParams.set("redirect_uri",cfg.redirectUri);
    url.searchParams.set("response_type","code");
    url.searchParams.set("scope",cfg.scopes.join(" "));
    url.searchParams.set("access_type","offline");
    url.searchParams.set("prompt","consent");
    url.searchParams.set("include_granted_scopes","true");
    url.searchParams.set("state",state);
    return json(res,200,{authorization_url:url.toString()});
  } catch(error) {
    return json(res,error.status||500,{error:error.message||"google_oauth_start_failed"});
  }
}
