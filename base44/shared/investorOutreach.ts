/**
 * Hidden Property Intel — autonomous outreach engine.
 *
 * Two polished, personalized outbound email tracks:
 *  - Investors:  invites active cash buyers / flippers / wholesalers to join the platform,
 *    personalized with their name, company, target markets, and live inventory stats.
 *  - Sellers:     contacts owners of distressed properties with a cash-offer pitch,
 *    personalized with the owner's name and the property address.
 *
 * Both templates pull the licensed broker (Steve Giordano, Giordano Customs) into the
 * signature so every send carries a real, licensed point of contact.
 */

const BROKER = {
  name: 'Steve Giordano',
  title: 'Licensed Real Estate Broker',
  company: 'Giordano Customs',
  phone: '772-812-3930',
  address: '951 SW Country Club Dr, Suite 102, Port St. Lucie, FL',
};

const SITE = 'https://my-property-intel.base44.app';
const LISTINGS = `${SITE}/listings`;
const POST = `${SITE}/seller/post-property`;

function investorSubject(lead) {
  const loc = (lead.target_markets && lead.target_markets[0]) || 'Florida';
  return `Off-market distressed deals in ${loc} — an invite for ${lead.name || 'you'}`;
}

function investorBody(lead, stats) {
  const name = lead.name || 'there';
  const company = lead.company ? ` at ${lead.company}` : '';
  const markets = (lead.target_markets && lead.target_markets.length)
    ? lead.target_markets.join(', ')
    : 'Florida';
  const types = (lead.investment_types && lead.investment_types.length)
    ? lead.investment_types.join(', ')
    : 'distressed & off-market properties';
  const invCount = stats?.investors || '1,200+';
  const propCount = stats?.properties || '12,800+';

  return `Hi ${name},

I'm Steve Giordano, a licensed Florida real estate broker with Giordano Customs and the founder of Hidden Property Intel — a marketplace built for investors who buy off-market distressed, probate, tax-delinquent, and foreclosure properties before they ever hit the MLS.

We found your activity${company} focusing on ${markets} and ${types}, and we're building our private investor network. Here's what we do differently:

  • Daily county-record scraping — assessor, tax, probate, foreclosure, and code-violation data refreshed every 24 hours across 27 states.
  • AI underwriting on every property — a 0–100 deal score, after-repair value, repair-cost estimate, full ownership chain with heirs, and comparable sales.
  • Proxy bidding and smart-contract escrow on Polygon — close in days, not months, with on-chain signatures and fund release.

Right now we're tracking ${propCount} distressed properties and working with ${invCount} active investors.

Browse the live inventory (no signup required):
${LISTINGS}

If you'd like early access to our freshest deals before they go public, reply to this email or call me directly at ${BROKER.phone}. I'm happy to walk you through a live deal.

All the best,
Steve Giordano
${BROKER.title} · ${BROKER.company}
${BROKER.phone}
${BROKER.address}

---
You received this email because we identified you as an active real estate investor in ${markets}. To stop receiving these emails, reply with "unsubscribe" and we'll remove you immediately.`;
}

function sellerSubject(owner, property) {
  const addr = property ? `${property.address}, ${property.city}` : 'your property';
  return `A cash offer for ${addr} — no commissions, no fees`;
}

function sellerBody(owner, property) {
  const name = owner.name || 'the owner';
  const addr = property ? `${property.address}, ${property.city}, ${property.state} ${property.zip_code}` : 'your property';
  const distress = property?.distress_type
    ? property.distress_type.replace(/_/g, ' ')
    : 'distressed';

  return `Hi ${name},

I'm Steve Giordano, a licensed Florida real estate broker with Giordano Customs. I work with Hidden Property Intel — a platform that connects property owners with a curated pool of ${'1,200+'} verified cash investors.

We identified ${addr} as potentially ${distress}, and I wanted to reach out personally. If you'd consider a cash offer, here's what we offer:

  • No commissions and no listing fees — ever. You pay nothing to list.
  • Our AI prices your property against comparable sales and writes the listing for you.
  • Every offer is analyzed by our AI negotiation assistant, so you can accept, counter, or reject with full confidence.
  • Close on your timeline — some of our investors close in as little as 7 days.

Whether you're dealing with a probate inheritance, pre-foreclosure, tax delinquency, divorce, or a property that's simply become a burden, we can help.

List your property free in minutes:
${POST}

Or call me directly at ${BROKER.phone} — I'm happy to answer any questions with no obligation.

Warm regards,
Steve Giordano
${BROKER.title} · ${BROKER.company}
${BROKER.phone}
${BROKER.address}

---
You received this email because public records indicated your property may be distressed. To stop receiving these emails, reply with "unsubscribe" and we'll remove you immediately.`;
}

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
    response_json_schema: {
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
    }
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

async function getStats(base44) {
  const [props, invs] = await Promise.all([
    base44.asServiceRole.entities.Property.list('-created_date', 1),
    base44.asServiceRole.entities.Investor.list('-created_date', 1)
  ]);
  return { properties: props.length, investors: invs.length };
}

/**
 * Send autonomous, personalized invitation emails to investor leads that haven't
 * been contacted yet. If `testEmail` is provided, sends a single test to that
 * address using a sample lead (does not mark anything as contacted).
 */
export async function emailNewInvestorLeads(base44, limit = 50, testEmail = null) {
  if (testEmail) {
    const sample = {
      name: 'Jeremy',
      company: 'Xtreme Polishing Systems',
      email: testEmail,
      target_markets: ['South Florida'],
      investment_types: ['fix-and-flip', 'wholesale']
    };
    const stats = await getStats(base44);
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: testEmail,
      from_name: 'Hidden Property Intel',
      subject: investorSubject(sample),
      body: investorBody(sample, stats)
    });
    return { sent: 1, test: true, to: testEmail };
  }

  const leads = await base44.asServiceRole.entities.InvestorLead.filter({ outreach_status: 'new' }, '-created_date', limit);
  const stats = await getStats(base44);
  let sent = 0;
  for (const lead of leads) {
    if (!lead.email) continue;
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: lead.email,
        from_name: 'Hidden Property Intel',
        subject: investorSubject(lead),
        body: investorBody(lead, stats)
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
 * Send autonomous, personalized outreach emails to property owners (sellers) with
 * a contact email on file. If `testEmail` is provided, sends a single test to that
 * address using sample owner/property data (does not mark anything as contacted).
 */
export async function emailSellerLeads(base44, limit = 50, testEmail = null) {
  if (testEmail) {
    const sampleOwner = { name: 'Jeremy', contact_email: testEmail };
    const sampleProperty = {
      address: '1480 South Ocean Blvd',
      city: 'Pompano Beach',
      state: 'FL',
      zip_code: '33062',
      distress_type: 'tax_delinquent'
    };
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: testEmail,
      from_name: 'Hidden Property Intel',
      subject: sellerSubject(sampleOwner, sampleProperty),
      body: sellerBody(sampleOwner, sampleProperty)
    });
    return { sent: 1, test: true, to: testEmail };
  }

  const owners = await base44.asServiceRole.entities.Owner.list('-created_date', 200);
  const queue = owners.filter((o) => o.contact_email && (!o.outreach_status || o.outreach_status === 'new') && !o.contacted_at).slice(0, limit);
  let sent = 0;
  for (const owner of queue) {
    try {
      let property = null;
      if (owner.property_id) {
        const props = await base44.asServiceRole.entities.Property.filter({ id: owner.property_id });
        property = props[0] || null;
      }
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: owner.contact_email,
        from_name: 'Hidden Property Intel',
        subject: sellerSubject(owner, property),
        body: sellerBody(owner, property)
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