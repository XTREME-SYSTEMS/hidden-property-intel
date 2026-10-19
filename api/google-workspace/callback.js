import { encryptCredential, googleConfig, json, safeReturnTo, serviceQuery, SITE_KEY, verifyState } from "../_lib/googleWorkspace.js";

export default async function handler(req,res) {
  try {
    if (req.method !== "GET") return json(res,405,{error:"method_not_allowed"});
    if (req.query?.error) throw Object.assign(new Error(String(req.query.error_description || req.query.error)),{status:400});
    const code=String(req.query?.code || "");
    const state=verifyState(req.query?.state);
    if (!code) throw Object.assign(new Error("Missing Google authorization code"),{status:400});
    const cfg=googleConfig();

    const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{
      method:"POST",
      headers:{"content-type":"application/x-www-form-urlencoded"},
      body:new URLSearchParams({
        code,
        client_id:cfg.clientId,
        client_secret:cfg.clientSecret,
        redirect_uri:cfg.redirectUri,
        grant_type:"authorization_code",
      }),
    });
    const tokens=await tokenResponse.json().catch(()=>null);
    if (!tokenResponse.ok || !tokens?.access_token) {
      throw Object.assign(new Error("Google token exchange failed"),{status:502});
    }

    const infoResponse=await fetch("https://openidconnect.googleapis.com/v1/userinfo",{
      headers:{Authorization:`Bearer ${tokens.access_token}`},
    });
    const info=await infoResponse.json().catch(()=>({}));
    if (!infoResponse.ok) throw Object.assign(new Error("Google user profile lookup failed"),{status:502});

    const credential=encryptCredential({
      refresh_token:tokens.refresh_token || null,
      access_token:tokens.access_token,
      token_type:tokens.token_type || "Bearer",
      expires_at:Date.now()+(Number(tokens.expires_in||3600)*1000),
      scope:tokens.scope || cfg.scopes.join(" "),
    });

    await serviceQuery("universal_google_workspace_credentials?on_conflict=user_id,site_key",{
      method:"POST",
      headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify({
        user_id:state.uid,
        site_key:SITE_KEY,
        ciphertext:credential.ciphertext,
        iv:credential.iv,
        auth_tag:credential.auth_tag,
        key_version:"v1",
        updated_at:new Date().toISOString(),
      }),
    });

    await serviceQuery("universal_google_workspace_connections?on_conflict=user_id,site_key",{
      method:"POST",
      headers:{Prefer:"resolution=merge-duplicates,return=minimal"},
      body:JSON.stringify({
        user_id:state.uid,
        site_key:SITE_KEY,
        google_subject:info.sub || null,
        google_account_email:info.email || null,
        scopes:String(tokens.scope || cfg.scopes.join(" ")).split(/\s+/),
        status:"connected",
        credential_ref:`vault:user:${state.uid}:site:${SITE_KEY}`,
        access_expires_at:new Date(Date.now()+Number(tokens.expires_in||3600)*1000).toISOString(),
        connected_at:new Date().toISOString(),
        updated_at:new Date().toISOString(),
      }),
    });

    res.status(302).setHeader("cache-control","no-store");
    res.setHeader("location",`${safeReturnTo(state.returnTo)}?google_workspace=connected`);
    res.end();
  } catch(error) {
    return json(res,error.status||500,{error:error.message||"google_oauth_callback_failed"});
  }
}
