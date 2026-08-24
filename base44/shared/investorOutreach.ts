const INVESTOR_SCHEMA = {
  type: 'object',
  properties: {
    investors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          company: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          website: { type: 'string' },
          target_markets: { type: 'array', items: { type: 'string' } },
          investment_types: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }
};

/**
 * Harvest real-estate investor contacts for a region via LLM web search and
 * store them as InvestorLead records (deduped by email).
 */
export async function scrapeInvestorsForRegion(base44, region, max_results = 20) {
  const prompt = `You are sourcing real estate investor leads. Search the web for active real estate investors, cash buyers, house flippers, wholesalers, and investment firms operating in ${region} (Florida). Return up to ${max_results} leads with publicly listed contact information (name, company, email, phone, website, target markets, investment types). Only include leads with at least an email or phone. Return JSON only.`;

  const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: true,
    model: 'gemini_3_flash',
    response_json_schema: INVESTOR_SCHEMA
  });

  const leads = r.investors || [];
  let saved = 0;
  for (const l of leads) {
    if (!l.email && !l.phone) continue;
    if (l.email) {
      const existing = await base44.asServiceRole.entities.InvestorLead.filter({ email: l.email });
      if (existing.length) continue;
    }
    await base44.asServiceRole.entities.InvestorLead.create({
      name: l.name || 'Unknown',
      company: l.company,
      email: l.email,
      phone: l.phone,
      website: l.website,
      target_markets: l.target_markets || [],
      investment_types: l.investment_types || [],
      region,
      source: 'ai_web_search',
      outreach_status: 'new'
    });
    saved++;
  }
  return { found: leads.length, saved };
}

/**
 * Send autonomous invitation emails to investor leads that haven't been contacted yet.
 */
export async function emailNewInvestorLeads(base44, limit = 50) {
  const leads = await base44.asServiceRole.entities.InvestorLead.filter({ outreach_status: 'new' }, '-created_date', limit);
  let sent = 0;
  for (const lead of leads) {
    if (!lead.email) continue;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        from_name: 'Hidden Property Intel',
        subject: 'Off-market distressed Florida properties — Hidden Property Intel',
        body: `Hi ${lead.name || 'there'},\n\nI'm reaching out from Hidden Property Intel, a marketplace for off-market distressed, probate, and foreclosure properties in Florida. We scrape county records daily and surface deals with AI underwriting — 0-100 scores, ARV, repair estimates, full ownership chains — and close with smart-contract escrow on Polygon.\n\nWe're building our investor network and thought you'd be a fit. Browse inventory and subscribe at https://hiddenpropertyintel.com/listings.\n\nReply to learn more.\n\n— The Hidden Property Intel team\n\n---\nYou received this email because we identified you as an active real estate investor. If you'd like to stop receiving these emails, reply with "unsubscribe" and we'll remove you from our list.`
      });
      await base44.asServiceRole.entities.InvestorLead.update(lead.id, {
        outreach_status: 'contacted',
        last_contacted: new Date().toISOString(),
        contact_count: (lead.contact_count || 0) + 1
      });
      sent++;
    } catch (e) {
      console.error('investor email failed', lead.email, e?.message);
    }
  }
  return { sent };
}

/**
 * Send autonomous outreach emails to property owners (sellers) with a contact email
 * on file, inviting them to list for a cash offer. Dedupes via Owner.outreach_status.
 */
export async function emailSellerLeads(base44, limit = 50) {
  const owners = await base44.asServiceRole.entities.Owner.list('-created_date', 200);
  const queue = owners.filter((o) => o.contact_email && (!o.outreach_status || o.outreach_status === 'new') && !o.contacted_at).slice(0, limit);
  let sent = 0;
  for (const owner of queue) {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: owner.contact_email,
        from_name: 'Hidden Property Intel',
        subject: 'A cash offer for your Florida property — Hidden Property Intel',
        body: `Hi ${owner.name || 'there'},\n\nHidden Property Intel connects property owners with verified investors who buy distressed, inherited, or under-stress properties for cash — no commissions, no fees, close on your timeline. If you'd consider a cash offer, list your property free at https://hiddenpropertyintel.com/listings and our AI will price it and surface it to 1,200+ investors.\n\nReply if you'd like to learn more.\n\n— The Hidden Property Intel team\n\n---\nYou received this email because we identified your property as potentially distressed. If you'd like to stop receiving these emails, reply with "unsubscribe" and we'll remove you from our list.`
      });
      await base44.asServiceRole.entities.Owner.update(owner.id, {
        outreach_status: 'contacted',
        contacted_at: new Date().toISOString()
      });
      sent++;
    } catch (e) {
      console.error('seller email failed', owner.contact_email, e?.message);
    }
  }
  return { sent };
}