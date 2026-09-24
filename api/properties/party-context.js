import { json, requireUser } from "../_lib/supabaseServer.js";

const SUPABASE_URL=process.env.HPI_SUPABASE_URL||process.env.SUPABASE_URL||"https://fwtchbsebygwifmmqhur.supabase.co";
function key(){const k=process.env.HPI_SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!k){const e=new Error("Supabase service role is not configured");e.status=503;throw e;}return k;}
const isUuid=(value)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));

async function fetchRows(path,headers){
  const r=await fetch(`${SUPABASE_URL}/rest/v1/${path}`,{headers});
  const data=await r.json().catch(()=>[]);
  if(!r.ok) throw Object.assign(new Error("Supabase lookup failed"),{status:502});
  return data;
}

export default async function handler(req,res){
  try{
    if(req.method!=="GET") return json(res,405,{error:"method_not_allowed"});
    const user=await requireUser(req);
    const id=String(req.query?.property_id||"");
    const k=key();
    const headers={apikey:k,Authorization:`Bearer ${k}`};

    let rows=await fetchRows(`properties?select=seller_id&base44_id=eq.${encodeURIComponent(id)}&limit=1`,headers);
    if(!rows?.[0] && isUuid(id)){
      rows=await fetchRows(`properties?select=seller_id&id=eq.${encodeURIComponent(id)}&limit=1`,headers);
    }

    const roles=await fetchRows(`universal_user_profiles?select=role&id=eq.${encodeURIComponent(user.id)}&limit=1`,headers);
    const role=roles?.[0]?.role||"investor";
    return json(res,200,{isSellerOrAdmin:role==="admin"||rows?.[0]?.seller_id===user.id,role});
  }catch(e){return json(res,e.status||500,{error:e.message||"party_context_failed"});}
}
