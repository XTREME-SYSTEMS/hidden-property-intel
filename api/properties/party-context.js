import { json, requireUser } from "../_lib/supabaseServer.js";

const SUPABASE_URL=process.env.HPI_SUPABASE_URL||process.env.SUPABASE_URL||"https://fwtchbsebygwifmmqhur.supabase.co";
function key(){const k=process.env.HPI_SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!k){const e=new Error("Supabase service role is not configured");e.status=503;throw e;}return k;}

export default async function handler(req,res){
  try{
    if(req.method!=="GET") return json(res,405,{error:"method_not_allowed"});
    const user=await requireUser(req);
    const id=String(req.query?.property_id||"");
    const k=key();
    const headers={apikey:k,Authorization:`Bearer ${k}`};
    const p=await fetch(`${SUPABASE_URL}/rest/v1/properties?select=seller_id&or=(base44_id.eq.${encodeURIComponent(id)},id.eq.${encodeURIComponent(id)})&limit=1`,{headers});
    const rows=await p.json().catch(()=>[]);
    if(!p.ok) throw Object.assign(new Error("Property context lookup failed"),{status:502});
    const r=await fetch(`${SUPABASE_URL}/rest/v1/universal_user_profiles?select=role&id=eq.${encodeURIComponent(user.id)}&limit=1`,{headers});
    const roles=await r.json().catch(()=>[]);
    const role=roles?.[0]?.role||"investor";
    return json(res,200,{isSellerOrAdmin:role==="admin"||rows?.[0]?.seller_id===user.id,role});
  }catch(e){return json(res,e.status||500,{error:e.message||"party_context_failed"});}
}
