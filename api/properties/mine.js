import { json, requireUser } from "../_lib/supabaseServer.js";
const SUPABASE_URL=process.env.HPI_SUPABASE_URL||process.env.SUPABASE_URL||"https://fwtchbsebygwifmmqhur.supabase.co";
function key(){const k=process.env.HPI_SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;if(!k){const e=new Error("Supabase service role is not configured");e.status=503;throw e;}return k;}
export default async function handler(req,res){
  try{
    if(req.method!=="GET") return json(res,405,{error:"method_not_allowed"});
    const user=await requireUser(req);
    const k=key();
    const q=new URLSearchParams({
      select:"id,base44_id,address,city,state,zip_code,status,distress_type,proposed_asking_price,images,updated_date",
      seller_id:`eq.${user.id}`,
      order:"updated_date.desc"
    });
    const r=await fetch(`${SUPABASE_URL}/rest/v1/properties?${q.toString()}`,{headers:{apikey:k,Authorization:`Bearer ${k}`}});
    const rows=await r.json().catch(()=>[]);
    if(!r.ok) throw Object.assign(new Error("Seller property lookup failed"),{status:502});
    return json(res,200,{properties:rows.map(({base44_id,...p})=>({...p,id:base44_id||p.id,universal_id:p.id}))});
  }catch(e){return json(res,e.status||500,{error:e.message||"seller_properties_failed"});}
}
