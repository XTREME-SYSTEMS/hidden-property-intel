/**
 * Hidden Property Intel — Complete Email Template Gallery
 * @redeploy 2026-09-04
 *
 * Every type of outgoing, outreach, response, and follow-up email used across
 * the platform, organized by audience and purpose. Each template is branded,
 * compliant, and ready for AI personalization via Eden Skye.
 *
 * Categories:
 *  1. INVESTOR_OUTREACH     — Cold, follow-ups, deal alerts, welcome
 *  2. OWNER_OUTREACH        — Cold, follow-ups, cash offers, distress-specific
 *  3. PROBATE_OUTREACH      — Heir initial, follow-up, condolences
 *  4. RESPONSE_TEMPLATES    — Replies to investor/seller/heir inquiries
 *  5. TRANSACTIONAL         — Bid notifications, contract, escrow, closing
 *  6. SYSTEM_ACCOUNT        — Welcome, payment, subscription
 *  7. AGENT_PROFESSIONAL    — Referrals, partnerships, coordination
 *  8. SOCIAL_MEDIA          — LinkedIn, Facebook, Instagram, Twitter/X
 */

export interface EmailTemplate {
  id: string;
  category: string;
  name: string;
  description: string;
  audience: "investor" | "seller" | "owner" | "heir" | "agent" | "internal" | "social";
  type: "cold_outreach" | "follow_up" | "response" | "transactional" | "system" | "social_media";
  subject: string;
  body: string;
  variables: string[];
  tone: string;
}

const SIGNATURE = `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e7e1d6;font-size:13px;color:#6f6a60">
<p style="margin:0"><strong style="color:#c38a1b">Eden Skye</strong><br>Executive Assistant | Hidden Property Intel<br>Licensed Real Estate Support<br>772-812-3930 | eden@hiddenpropertyintel.com</p>
</div>`;

const WRAPPER = (content: string) => `<div style="font-family:Inter,Arial,sans-serif;max-width:600px;margin:auto;color:#1a1a1a;line-height:1.65">
<div style="background:#0b0b0b;padding:16px 24px;text-align:center">
<span style="color:#e4b653;font-size:11px;letter-spacing:0.3em;text-transform:uppercase">Hidden Property Intel</span>
</div>
<div style="padding:28px 24px">${content}${SIGNATURE}</div>
</div>`;

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  // ═══════════════════════════════════════════════════════════════
  // 1. INVESTOR OUTREACH
  // ═══════════════════════════════════════════════════════════════
  {
    id: "inv_cold_01",
    category: "Investor Outreach",
    name: "Cold Outreach — New Investor",
    description: "First touch to a newly identified investor lead. Peer-level, value-first, low-friction CTA.",
    audience: "investor",
    type: "cold_outreach",
    subject: "Off-market {{city}} deals — saw your recent activity",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>I came across your work in {{target_market}} and wanted to reach out directly. I'm Eden, with Hidden Property Intel — we're a Florida-based platform that identifies off-market distressed properties before they hit the MLS.</p>
<p>I noticed your focus on {{investment_type}} in {{region}}. We're currently tracking {{property_count}} distressed properties in that area — pre-foreclosures, probate, tax-delinquent, and code violations — all scored with our AI (0-100) and updated daily from 317+ Florida data sources.</p>
<p>Would it be useful if I sent you 3-5 properties that match your criteria? No strings, just sharing what we're seeing on the ground.</p>
<p>Best regards,<br>Eden</p>`),
    variables: ["name", "target_market", "investment_type", "region", "property_count"],
    tone: "Peer-level, direct, value-first",
  },
  {
    id: "inv_followup_01",
    category: "Investor Outreach",
    name: "Follow-Up — Touch 2 (Day 3)",
    description: "Second touch. Acknowledges the first email may have been buried. Quick yes/no CTA.",
    audience: "investor",
    type: "follow_up",
    subject: "Re: Off-market {{city}} deals",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>Likely got buried — totally fair.</p>
<p>The short version: we help investors in {{target_market}} find off-market distressed properties before anyone else. Most of our clients see their first deal within 3-4 weeks of joining.</p>
<p>Quick yes/no — interested in a 10-minute look at what we're tracking in {{region}}, or not the right time?</p>
<p>Eden</p>`),
    variables: ["name", "target_market", "region"],
    tone: "Casual, low-pressure, direct",
  },
  {
    id: "inv_followup_02",
    category: "Investor Outreach",
    name: "Follow-Up — Touch 3 (Day 8, Value Add)",
    description: "Third touch with a value-add — market data or a specific property.",
    audience: "investor",
    type: "follow_up",
    subject: "{{city}} market data you might find useful",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>I wanted to share something useful even if you're not ready to talk.</p>
<p>We just analyzed {{property_count}} distressed properties in {{target_market}}. Here's what we're seeing:</p>
<ul>
<li><strong>{{distress_type_1}}:</strong> {{stat_1}} properties, median value ${{median_value_1}}</li>
<li><strong>{{distress_type_2}}:</strong> {{stat_2}} properties, median value ${{median_value_2}}</li>
<li>Average property score: {{avg_score}}/100</li>
</ul>
<p>If any of this is useful, I'm happy to send the full breakdown. And if you ever want to see live deals, I'm here.</p>
<p>Eden</p>`),
    variables: ["name", "property_count", "target_market", "distress_type_1", "stat_1", "median_value_1", "distress_type_2", "stat_2", "median_value_2", "avg_score"],
    tone: "Value-first, no pressure, helpful",
  },
  {
    id: "inv_breakup_01",
    category: "Investor Outreach",
    name: "Breakup Email — Final Touch",
    description: "Last touch in the sequence. Respectful breakup that often gets the highest reply rate.",
    audience: "investor",
    type: "follow_up",
    subject: "Closing the loop, {{name}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>I've reached out a few times and don't want to keep filling your inbox if this isn't the right fit right now.</p>
<p>If anything changes — or if you ever need off-market distressed property data in Florida — you know where to find me. I'll be here.</p>
<p>Wishing you the best with your investments in {{target_market}}.</p>
<p>Eden</p>`),
    variables: ["name", "target_market"],
    tone: "Respectful, warm, no hard feelings",
  },
  {
    id: "inv_deal_alert",
    category: "Investor Outreach",
    name: "Deal Alert — New Match",
    description: "Notifies an investor of a new property matching their saved search criteria.",
    audience: "investor",
    type: "transactional",
    subject: "New match: {{property_address}} (score {{score}}/100)",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>A new property just hit our system that matches your saved search criteria.</p>
<div style="background:#f7f5f0;border:1px solid #e7e1d6;border-radius:10px;padding:16px;margin:16px 0">
<p style="margin:0;font-size:16px;font-weight:bold">{{property_address}}</p>
<p style="margin:4px 0;color:#6f6a60">{{city}}, {{state}} {{zip_code}}</p>
<p style="margin:8px 0"><strong>Property Score:</strong> {{score}}/100 &nbsp;|&nbsp; <strong>Distress:</strong> {{distress_type}} &nbsp;|&nbsp; <strong>Est. Value:</strong> ${{estimated_value}}</p>
<p style="margin:8px 0"><strong>{{bedrooms}} bed / {{bathrooms}} bath / {{square_footage}} sqft</strong></p>
</div>
<p>This property scored high because {{score_reason}}. Based on your target markets, I thought you'd want to see it quickly.</p>
<p><a href="{{property_url}}" style="background:#0b0b0b;color:#e4b653;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:12px;letter-spacing:0.1em">VIEW PROPERTY</a></p>
<p>Eden</p>`),
    variables: ["name", "property_address", "city", "state", "zip_code", "score", "distress_type", "estimated_value", "bedrooms", "bathrooms", "square_footage", "score_reason", "property_url"],
    tone: "Excited, specific, action-oriented",
  },
  {
    id: "inv_welcome",
    category: "Investor Outreach",
    name: "Welcome — New Subscription",
    description: "Welcome email when an investor subscribes to a plan.",
    audience: "investor",
    type: "system",
    subject: "Welcome to Hidden Property Intel, {{name}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>Welcome to Hidden Property Intel — you're now part of Florida's most advanced distressed property intelligence platform.</p>
<p>Here's what you can do right now:</p>
<ul>
<li><strong>Search properties</strong> — Browse {{property_count}} scored, distressed properties across Florida</li>
<li><strong>Set up alerts</strong> — Get notified the moment a property matches your criteria</li>
<li><strong>Place bids</strong> — Make offers on off-market properties with proxy bidding</li>
<li><strong>Smart contracts</strong> — Close deals with blockchain escrow on Polygon</li>
</ul>
<p>Your plan: <strong>{{plan_name}}</strong> at ${{price}}/month. You can upgrade anytime.</p>
<p>I'm Eden, your executive assistant. If you need anything — finding properties, analyzing deals, or just have questions — reply to this email or call me at 772-812-3930.</p>
<p>Welcome aboard!</p>
<p>Eden</p>`),
    variables: ["name", "property_count", "plan_name", "price"],
    tone: "Warm, welcoming, helpful",
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. OWNER OUTREACH
  // ═══════════════════════════════════════════════════════════════
  {
    id: "own_cold_01",
    category: "Owner Outreach",
    name: "Cold Outreach — Distressed Owner",
    description: "First touch to a property owner in a distress situation. Empathetic, never pushy.",
    audience: "owner",
    type: "cold_outreach",
    subject: "A note about your property at {{property_address}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>I hope this note finds you well. My name is Eden, and I'm reaching out because I came across your property at {{property_address}} in {{city}}.</p>
<p>I work with Hidden Property Intel, and we help property owners in {{county}} County understand their options — whether that's selling, refinancing, or just getting clear information about their situation. There's no pressure here; I simply want you to know that resources exist if you ever need them.</p>
<p>If you're open to a brief, no-obligation conversation about what your property is worth in today's market and what options might be available to you, I'd be honored to help. And if not, that's perfectly okay too.</p>
<p>Either way, I wish you and your family the very best.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "property_address", "city", "county"],
    tone: "Empathetic, respectful, zero pressure",
  },
  {
    id: "own_followup_01",
    category: "Owner Outreach",
    name: "Follow-Up — Owner Touch 2",
    description: "Second touch to a property owner. Gentle, offers specific help.",
    audience: "owner",
    type: "follow_up",
    subject: "Following up — options for {{property_address}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>I wrote to you recently about your property at {{property_address}}. I know life gets busy, and I don't want to be a bother — I just wanted to make sure you saw my note.</p>
<p>I've been doing some research, and based on current market conditions in {{city}}, your property could be worth somewhere in the range of ${{estimated_value}}. If you've ever wondered what options are available — whether that's a cash sale, a refinancing, or something else — I'm here to help you understand them clearly.</p>
<p>There's absolutely no obligation. If you'd like to talk, I'm available at 772-812-3930, or just reply to this email. And if this isn't something you need right now, I completely understand.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "property_address", "city", "estimated_value"],
    tone: "Gentle, helpful, patient",
  },
  {
    id: "own_cash_offer",
    category: "Owner Outreach",
    name: "Cash Offer Letter",
    description: "Formal cash offer to a property owner after initial contact.",
    audience: "owner",
    type: "transactional",
    subject: "Cash offer for {{property_address}} — ${{offer_amount}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>Thank you for taking the time to speak with me about your property at {{property_address}}.</p>
<p>As discussed, Hidden Property Intel would like to present you with a formal cash offer:</p>
<div style="background:#f7f5f0;border:1px solid #e7e1d6;border-radius:10px;padding:20px;margin:16px 0">
<p style="margin:0;font-size:24px;font-weight:bold;color:#c38a1b">${{offer_amount}}</p>
<p style="margin:4px 0;color:#6f6a60">Cash offer · As-is condition · No repairs needed</p>
<p style="margin:8px 0"><strong>Closing:</strong> Within {{closing_days}} days, at your convenience</p>
<p style="margin:4px 0"><strong>Costs:</strong> We cover all closing costs</p>
<p style="margin:4px 0"><strong>Contingencies:</strong> None — this is a clean, all-cash offer</p>
</div>
<p>This offer is valid for {{offer_validity}} days. There's no pressure to decide quickly — take the time you need. If you have questions or want to discuss, I'm here at 772-812-3930.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "property_address", "offer_amount", "closing_days", "offer_validity"],
    tone: "Professional, clear, respectful",
  },
  {
    id: "own_preforeclosure",
    category: "Owner Outreach",
    name: "Pre-Foreclosure Help",
    description: "Empathetic outreach to owners facing pre-foreclosure. Offers solutions, not pressure.",
    audience: "owner",
    type: "cold_outreach",
    subject: "Understanding your options, {{name}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>I'm reaching out because public records indicate that the property at {{property_address}} may be entering a pre-foreclosure process. I know this can be an overwhelming situation, and I want you to know that you have options.</p>
<p>My name is Eden, and I work with Hidden Property Intel. We help homeowners in {{county}} County understand exactly what's happening and what choices are available — whether that's selling the property quickly for cash, working with your lender on a modification, or connecting you with a housing counselor.</p>
<p>The most important thing I can tell you is: you're not alone, and there are people who can help. If you'd like to talk through your situation — with no pressure and no obligation — I'm here. You can reach me at 772-812-3930 or just reply to this email.</p>
<p>Whatever you decide, I'm in your corner.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "property_address", "county"],
    tone: "Deeply empathetic, supportive, zero pressure",
  },
  {
    id: "own_tax_delinquent",
    category: "Owner Outreach",
    name: "Tax Delinquent Help",
    description: "Outreach to owners with delinquent property taxes. Offers solutions before tax sale.",
    audience: "owner",
    type: "cold_outreach",
    subject: "Property tax options for {{property_address}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>I'm writing to you because public records show that the property taxes on {{property_address}} are currently delinquent. I know this isn't the easiest thing to hear, but I want to help before the situation becomes more urgent.</p>
<p>In {{county}} County, when property taxes go unpaid, the property can eventually be sold at a tax deed sale — which means you could lose the property and any equity you have in it. But there's good news: there are options.</p>
<p>My name is Eden, and I work with Hidden Property Intel. We help property owners in this exact situation. We can potentially purchase your property for cash — paying off the tax debt and putting the remaining equity in your pocket — or connect you with resources to get back on track.</p>
<p>If you'd like to understand your options, I'm here to help. Call me at 772-812-3930 or reply to this email. No pressure, no judgment — just help.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "property_address", "county"],
    tone: "Informative, non-judgmental, helpful",
  },
  {
    id: "own_code_violation",
    category: "Owner Outreach",
    name: "Code Violation Outreach",
    description: "Outreach to owners with code violations on their property.",
    audience: "owner",
    type: "cold_outreach",
    subject: "About the code violations at {{property_address}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>I'm reaching out because {{city}} code enforcement records indicate there are open violations on your property at {{property_address}}. I know dealing with code violations can be stressful and expensive — and I want you to know there are options.</p>
<p>If repairing the property isn't feasible right now, we may be able to purchase it as-is — violations and all — so you can move forward without the burden. My name is Eden, and I work with Hidden Property Intel, helping property owners in exactly this kind of situation.</p>
<p>If you'd like to explore whether a cash sale makes sense for you, I'm here to talk. No pressure at all — just a conversation about what's possible.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "property_address", "city"],
    tone: "Understanding, practical, helpful",
  },

  // ═══════════════════════════════════════════════════════════════
  // 3. PROBATE OUTREACH
  // ═══════════════════════════════════════════════════════════════
  {
    id: "probate_initial",
    category: "Probate Outreach",
    name: "Heir Initial Outreach — Condolences",
    description: "First contact with a probate heir. Leads with condolences, never business. Deeply empathetic.",
    audience: "heir",
    type: "cold_outreach",
    subject: "Thinking of you and your family",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>I hope you'll forgive me for reaching out during what I know must be a difficult time. I recently learned about the passing of {{deceased_name}}, and I wanted to extend my deepest condolences to you and your family.</p>
<p>Losing someone close is never easy, and the weeks and months that follow can be overwhelming — especially when there are practical matters to handle alongside the grief. I know there's a lot to navigate, and I want you to know that you don't have to figure it all out alone.</p>
<p>My name is Eden, and I work with Hidden Property Intel. We help families who are dealing with inherited properties — properties that can sometimes become a source of stress during an already emotional time. Whether it's understanding the probate process, figuring out what to do with a property you've inherited, or just having someone to ask questions of, I'm here.</p>
<p>There's no rush and no pressure. If and when you're ready — whether that's next week or next month — I'm available to help in whatever way I can. You can reach me at 772-812-3930 or simply reply to this email.</p>
<p>Until then, please take care of yourself and your family.</p>
<p>With deepest sympathy,<br>Eden</p>`),
    variables: ["name", "deceased_name"],
    tone: "Deeply empathetic, patient, grief-aware",
  },
  {
    id: "probate_followup",
    category: "Probate Outreach",
    name: "Heir Follow-Up — Gentle",
    description: "Second touch to a probate heir. Very gentle, respects their grieving timeline.",
    audience: "heir",
    type: "follow_up",
    subject: "No rush — just wanted to check in",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>I wrote to you recently after learning about {{deceased_name}}'s passing. I know this is a time for family, not for business — so I'll be brief.</p>
<p>I just wanted to let you know that if you're starting to think about the practical side of things — the property at {{property_address}}, the probate process, or anything else — I'm here to help whenever you're ready. There's no timeline and no pressure.</p>
<p>Some families find it helpful to understand their options early, even if they're not ready to act. Others prefer to wait. Either way is perfectly okay.</p>
<p>Whenever you're ready, I'm here. 772-812-3930.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "deceased_name", "property_address"],
    tone: "Gentle, patient, no timeline pressure",
  },
  {
    id: "probate_property_inquiry",
    category: "Probate Outreach",
    name: "Heir — Property Options",
    description: "When an heir is ready to discuss the inherited property, outlines options clearly.",
    audience: "heir",
    type: "response",
    subject: "Options for the property at {{property_address}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>Thank you for taking the time to talk with me. I know this isn't easy, and I appreciate your trust.</p>
<p>As we discussed, you've inherited the property at {{property_address}} in {{city}}. Based on our research, the property's current value is approximately ${{estimated_value}}. Here are the options available to you:</p>
<ul>
<li><strong>Sell for cash, as-is:</strong> We can purchase the property quickly — no repairs, no cleaning, no staging. Close in as little as 14 days.</li>
<li><strong>List with an agent:</strong> If you have time and the property is in good condition, a traditional sale may net more. We can connect you with a trusted agent.</li>
<li><strong>Keep the property:</strong> If you'd like to keep it as a rental or move in, we can help you understand the transfer process and any ongoing costs.</li>
<li><strong>Take your time:</strong> There's no deadline. The property isn't going anywhere, and neither am I.</li>
</ul>
<p>If you'd like to explore any of these options, I'm here. No pressure, no rush — just help when you need it.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "property_address", "city", "estimated_value"],
    tone: "Clear, patient, supportive",
  },

  // ═══════════════════════════════════════════════════════════════
  // 4. RESPONSE TEMPLATES
  // ═══════════════════════════════════════════════════════════════
  {
    id: "resp_investor_inquiry",
    category: "Response Templates",
    name: "Response — Investor Inquiry",
    description: "AI-generated reply when an investor asks about properties, pricing, or coverage.",
    audience: "investor",
    type: "response",
    subject: "Re: {{original_subject}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>Great to hear from you — thanks for reaching out.</p>
<p>To answer your question: {{answer_to_question}}</p>
<p>{{additional_details}}</p>
<p>I'd love to get you set up with a quick walkthrough of the platform so you can see exactly what we're tracking in {{target_market}}. Would a 15-minute call this week work? I'm flexible — just let me know what day and time suits you.</p>
<p>Eden</p>`),
    variables: ["name", "original_subject", "answer_to_question", "additional_details", "target_market"],
    tone: "Peer-level, direct, helpful",
  },
  {
    id: "resp_seller_inquiry",
    category: "Response Templates",
    name: "Response — Seller/Owner Inquiry",
    description: "AI-generated reply when a property owner responds to outreach.",
    audience: "owner",
    type: "response",
    subject: "Re: {{original_subject}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>Thank you so much for getting back to me — I really appreciate it.</p>
<p>{{answer_to_question}}</p>
<p>{{additional_details}}</p>
<p>If you'd like to talk through this, I'm available at 772-812-3930 — or we can set up a time that works for you. There's no rush; I'm here whenever you're ready.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "original_subject", "answer_to_question", "additional_details"],
    tone: "Warm, empathetic, patient",
  },
  {
    id: "resp_heir_inquiry",
    category: "Response Templates",
    name: "Response — Heir Inquiry",
    description: "AI-generated reply when a probate heir responds. Extra gentle and patient.",
    audience: "heir",
    type: "response",
    subject: "Re: {{original_subject}}",
    body: WRAPPER(`<p>Dear {{name}},</p>
<p>Thank you for writing back. I know this can be a lot to think about, and I appreciate you taking the time.</p>
<p>{{answer_to_question}}</p>
<p>{{additional_details}}</p>
<p>Please don't feel any pressure to make decisions right now. I'm here whenever you're ready — whether that's this week, next month, or whenever feels right for you. You can always reach me at 772-812-3930.</p>
<p>Take care of yourself, {{name}}.</p>
<p>Warmly,<br>Eden</p>`),
    variables: ["name", "original_subject", "answer_to_question", "additional_details"],
    tone: "Gentle, patient, grief-aware",
  },
  {
    id: "resp_negotiation",
    category: "Response Templates",
    name: "Response — Price Negotiation",
    description: "AI-generated reply during price negotiations. Professional, firm but fair.",
    audience: "investor",
    type: "response",
    subject: "Re: Offer for {{property_address}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>Thank you for the offer on {{property_address}}. I've reviewed it carefully.</p>
<p>{{negotiation_response}}</p>
<p>{{counter_details}}</p>
<p>I want to make sure we find a number that works for everyone. Let's keep the conversation going — I'm confident we can get there.</p>
<p>Eden</p>`),
    variables: ["name", "property_address", "negotiation_response", "counter_details"],
    tone: "Professional, firm but collaborative",
  },

  // ═══════════════════════════════════════════════════════════════
  // 5. TRANSACTIONAL
  // ═══════════════════════════════════════════════════════════════
  {
    id: "tx_bid_accepted",
    category: "Transactional",
    name: "Bid Accepted — Investor",
    description: "Notifies investor their bid was accepted.",
    audience: "investor",
    type: "transactional",
    subject: "Your bid was accepted! {{property_address}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>Congratulations — your bid of ${{bid_amount}} on {{property_address}} has been accepted by the seller!</p>
<p>Here's what happens next:</p>
<ol>
<li><strong>Smart contract:</strong> We'll generate a blockchain escrow contract on Polygon within 24 hours.</li>
<li><strong>Earnest money:</strong> ${{earnest_money}} due within 3 business days.</li>
<li><strong>Inspection:</strong> You'll have {{inspection_days}} days for due diligence.</li>
<li><strong>Closing:</strong> Target closing date is {{closing_date}}.</li>
</ol>
<p>I'll be coordinating everything from here. If you have questions at any point, I'm your go-to person.</p>
<p>Eden</p>`),
    variables: ["name", "bid_amount", "property_address", "earnest_money", "inspection_days", "closing_date"],
    tone: "Excited, clear, action-oriented",
  },
  {
    id: "tx_bid_outbid",
    category: "Transactional",
    name: "Bid Outbid — Investor",
    description: "Notifies investor they were outbid and gives option to counter.",
    audience: "investor",
    type: "transactional",
    subject: "You've been outbid on {{property_address}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>I wanted to let you know that another investor has placed a higher bid on {{property_address}}.</p>
<div style="background:#f7f5f0;border:1px solid #e7e1d6;border-radius:10px;padding:16px;margin:16px 0">
<p style="margin:0"><strong>Your bid:</strong> ${{your_bid}}</p>
<p style="margin:4px 0"><strong>Current high bid:</strong> ${{current_bid}}</p>
</div>
<p>If you'd like to place a counter-bid, you can do so directly on the property page. If you set up proxy bidding, we'll automatically increase your bid up to your max of ${{max_proxy}}.</p>
<p><a href="{{property_url}}" style="background:#0b0b0b;color:#e4b653;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:12px">COUNTER BID</a></p>
<p>Eden</p>`),
    variables: ["name", "property_address", "your_bid", "current_bid", "max_proxy", "property_url"],
    tone: "Neutral, informative, actionable",
  },
  {
    id: "tx_contract_signing",
    category: "Transactional",
    name: "Contract Signing Request",
    description: "Requests digital signature on a smart contract.",
    audience: "investor",
    type: "transactional",
    subject: "Action needed: Sign your contract for {{property_address}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>Your smart contract for {{property_address}} has been generated and is ready for your signature.</p>
<div style="background:#f7f5f0;border:1px solid #e7e1d6;border-radius:10px;padding:16px;margin:16px 0">
<p style="margin:0"><strong>Contract type:</strong> {{contract_type}}</p>
<p style="margin:4px 0"><strong>Price:</strong> ${{price}}</p>
<p style="margin:4px 0"><strong>Escrow:</strong> {{escrow_amount}} (Polygon blockchain)</p>
<p style="margin:4px 0"><strong>Closing date:</strong> {{closing_date}}</p>
</div>
<p>Please review and sign the contract using our secure digital signature system. Once signed, the contract will be deployed to the Polygon blockchain and escrow funding will begin.</p>
<p><a href="{{contract_url}}" style="background:#0b0b0b;color:#e4b653;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:12px">REVIEW & SIGN</a></p>
<p>This link expires in 7 days. If you have questions before signing, call me at 772-812-3930.</p>
<p>Eden</p>`),
    variables: ["name", "property_address", "contract_type", "price", "escrow_amount", "closing_date", "contract_url"],
    tone: "Clear, urgent but calm, professional",
  },
  {
    id: "tx_closing_reminder",
    category: "Transactional",
    name: "Closing Reminder",
    description: "Reminder about upcoming closing date.",
    audience: "investor",
    type: "transactional",
    subject: "Closing reminder: {{property_address}} in {{days_until_closing}} days",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>This is a friendly reminder that your closing for {{property_address}} is scheduled for <strong>{{closing_date}}</strong> — that's in {{days_until_closing}} days.</p>
<p>Here's your closing checklist:</p>
<ul>
<li>{{checklist_item_1}}</li>
<li>{{checklist_item_2}}</li>
<li>{{checklist_item_3}}</li>
</ul>
<p>If everything on this list is complete, you're all set. If anything is outstanding, let's take care of it this week.</p>
<p>I'll be at the closing (virtually or in person) to make sure everything goes smoothly. See you then!</p>
<p>Eden</p>`),
    variables: ["name", "property_address", "closing_date", "days_until_closing", "checklist_item_1", "checklist_item_2", "checklist_item_3"],
    tone: "Warm, organized, reassuring",
  },

  // ═══════════════════════════════════════════════════════════════
  // 6. SYSTEM / ACCOUNT
  // ═══════════════════════════════════════════════════════════════
  {
    id: "sys_payment_receipt",
    category: "System / Account",
    name: "Payment Receipt",
    description: "Receipt after successful subscription payment.",
    audience: "investor",
    type: "system",
    subject: "Payment receipt — ${{amount}} for {{plan_name}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>Thank you for your payment. Here's your receipt:</p>
<div style="background:#f7f5f0;border:1px solid #e7e1d6;border-radius:10px;padding:16px;margin:16px 0">
<p style="margin:0"><strong>Plan:</strong> {{plan_name}}</p>
<p style="margin:4px 0"><strong>Amount:</strong> ${{amount}}</p>
<p style="margin:4px 0"><strong>Date:</strong> {{payment_date}}</p>
<p style="margin:4px 0"><strong>Next billing:</strong> {{next_billing_date}}</p>
<p style="margin:4px 0"><strong>Transaction ID:</strong> {{transaction_id}}</p>
</div>
<p>Your subscription is active and in good standing. You can manage your subscription anytime from your dashboard.</p>
<p>Eden</p>`),
    variables: ["name", "plan_name", "amount", "payment_date", "next_billing_date", "transaction_id"],
    tone: "Professional, clear, appreciative",
  },
  {
    id: "sys_payment_failed",
    category: "System / Account",
    name: "Payment Failed",
    description: "Notification when a subscription payment fails.",
    audience: "investor",
    type: "system",
    subject: "Action needed: Payment failed for {{plan_name}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>We weren't able to process your most recent payment of ${{amount}} for your {{plan_name}} subscription. This can happen for a variety of reasons — an expired card, a changed billing address, or a temporary bank issue.</p>
<p>To keep your account active, please update your payment method:</p>
<p><a href="{{update_url}}" style="background:#0b0b0b;color:#e4b653;padding:10px 20px;text-decoration:none;border-radius:6px;font-size:12px">UPDATE PAYMENT</a></p>
<p>Your account will remain active for 7 days while we retry. If you have any questions or need help, I'm here at 772-812-3930.</p>
<p>Eden</p>`),
    variables: ["name", "amount", "plan_name", "update_url"],
    tone: "Helpful, non-alarming, supportive",
  },

  // ═══════════════════════════════════════════════════════════════
  // 7. AGENT / PROFESSIONAL
  // ═══════════════════════════════════════════════════════════════
  {
    id: "agent_referral",
    category: "Agent / Professional",
    name: "Agent Referral Outreach",
    description: "Outreach to a licensed agent for referral partnership.",
    audience: "agent",
    type: "cold_outreach",
    subject: "Partnership opportunity — off-market deals in {{county}}",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>I came across your profile and was impressed by your work in {{market_area}}. I'm Eden, with Hidden Property Intel.</p>
<p>We're a Florida-based platform that identifies off-market distressed properties — pre-foreclosures, probate, tax-delinquent, code violations — across all 67 counties. We're building a network of trusted agents to help our investors and sellers with listings, and I thought you'd be a great fit.</p>
<p>Here's what a partnership could look like:</p>
<ul>
<li><strong>Referral fees:</strong> We refer sellers who need a traditional listing (not a cash sale) to you</li>
<li><strong>Buyer representation:</strong> Our investors often need agent representation for closing</li>
<li><strong>Co-marketing:</strong> We can feature your listings to our investor network</li>
</ul>
<p>If you're open to a conversation, I'd love to set up a brief call. Would this week work?</p>
<p>Eden</p>`),
    variables: ["name", "market_area", "county"],
    tone: "Professional, collaborative, value-oriented",
  },
  {
    id: "agent_title_coordination",
    category: "Agent / Professional",
    name: "Title Company Coordination",
    description: "Coordinates with a title company for a closing.",
    audience: "agent",
    type: "transactional",
    subject: "Title order — {{property_address}} (closing {{closing_date}})",
    body: WRAPPER(`<p>Hi {{name}},</p>
<p>I'm coordinating a closing for {{property_address}} and would like to open a title order with your office.</p>
<div style="background:#f7f5f0;border:1px solid #e7e1d6;border-radius:10px;padding:16px;margin:16px 0">
<p style="margin:0"><strong>Property:</strong> {{property_address}}</p>
<p style="margin:4px 0"><strong>Seller:</strong> {{seller_name}}</p>
<p style="margin:4px 0"><strong>Buyer:</strong> {{buyer_name}}</p>
<p style="margin:4px 0"><strong>Sale price:</strong> ${{sale_price}}</p>
<p style="margin:4px 0"><strong>Target closing:</strong> {{closing_date}}</p>
<p style="margin:4px 0"><strong>Contract type:</strong> Smart contract escrow (Polygon)</p>
</div>
<p>Please let me know what you need from us to get started — I'll send the contract and any additional documents right away.</p>
<p>Eden</p>`),
    variables: ["name", "property_address", "seller_name", "buyer_name", "sale_price", "closing_date"],
    tone: "Professional, organized, efficient",
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. SOCIAL MEDIA
  // ═══════════════════════════════════════════════════════════════
  {
    id: "sm_linkedin_connection",
    category: "Social Media",
    name: "LinkedIn Connection Request",
    description: "Connection request message for LinkedIn.",
    audience: "social",
    type: "social_media",
    subject: "",
    body: `Hi {{name}}, I'm Eden with Hidden Property Intel — we track off-market distressed properties across Florida. Saw your work in {{market}} and would love to connect. No pitch, just expanding my network with serious investors in the space.`,
    variables: ["name", "market"],
    tone: "Casual, peer-level, no pitch",
  },
  {
    id: "sm_linkedin_followup",
    category: "Social Media",
    name: "LinkedIn Follow-Up Message",
    description: "Follow-up message after LinkedIn connection is accepted.",
    audience: "social",
    type: "social_media",
    subject: "",
    body: `Thanks for connecting, {{name}}! If you're ever looking for off-market distressed property data in Florida — pre-foreclosures, probate, tax liens — we track 317+ sources daily. Happy to share what we're seeing in {{market}} anytime. No strings.`,
    variables: ["name", "market"],
    tone: "Friendly, value-first, no pressure",
  },
  {
    id: "sm_facebook_dm",
    category: "Social Media",
    name: "Facebook DM — Investor",
    description: "Direct message to an investor on Facebook.",
    audience: "social",
    type: "social_media",
    subject: "",
    body: `Hi {{name}}! 👋 I'm Eden with Hidden Property Intel. We help Florida investors find off-market distressed deals — scored with AI, updated daily. Saw you're active in {{market}} and thought we might be a good resource for you. No pressure — just wanted to say hi and open the door!`,
    variables: ["name", "market"],
    tone: "Friendly, casual, warm",
  },
  {
    id: "sm_instagram_dm",
    category: "Social Media",
    name: "Instagram DM — Investor",
    description: "Direct message to an investor on Instagram.",
    audience: "social",
    type: "social_media",
    subject: "",
    body: `Hey {{name}}! Love your content — saw you're investing in {{market}}. We track off-market distressed properties across all of Florida and I thought you might find it useful. No pitch, just wanted to connect 🙏`,
    variables: ["name", "market"],
    tone: "Casual, friendly, emoji-appropriate",
  },
  {
    id: "sm_twitter_dm",
    category: "Social Media",
    name: "Twitter/X DM — Investor",
    description: "Direct message to an investor on Twitter/X.",
    audience: "social",
    type: "social_media",
    subject: "",
    body: `Hi {{name}} — I'm Eden with Hidden Property Intel. We track off-market distressed FL properties (pre-foreclosure, probate, tax liens) — 317+ sources, AI-scored, updated daily. Saw you're active in {{market}}. Happy to share what we're tracking if useful. No strings.`,
    variables: ["name", "market"],
    tone: "Concise, direct, value-first",
  },
  {
    id: "sm_post_education",
    category: "Social Media",
    name: "Social Post — Educational",
    description: "Educational social media post about distressed property investing.",
    audience: "social",
    type: "social_media",
    subject: "",
    body: `Did you know? Florida has 67 counties, each with its own foreclosure, tax-lien, and probate processes. 🏛️\n\nAt Hidden Property Intel, we track 317+ data sources across all of them — daily — so you never miss a deal.\n\nWhat's your go-to distress type? Drop it below 👇\n\n#RealEstateInvesting #FloridaRealEstate #DistressedProperties #OffMarketDeals`,
    variables: [],
    tone: "Educational, engaging, community-building",
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get templates by audience
 */
export function getTemplatesByAudience(audience: string): EmailTemplate[] {
  return EMAIL_TEMPLATES.filter((t) => t.audience === audience);
}

/**
 * Get all categories
 */
export function getCategories(): string[] {
  return [...new Set(EMAIL_TEMPLATES.map((t) => t.category))];
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string): EmailTemplate | undefined {
  return EMAIL_TEMPLATES.find((t) => t.id === id);
}