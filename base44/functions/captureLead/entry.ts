import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { secrets } from "base44:runtime";

// Public lead-capture endpoint for the V2 nav (Updates / Favorites / Plan / Inbox).
// Creates an InvestorLead (CRM), has the Eden Skye AI agent write a personalized
// intro, sends it via email (and SMS/MMS through Telnyx when a phone + active
// sender number exist), logs every touch as a CommsEvent in the Xtreme Comms
// system, and marks the lead contacted. No auth required — the app is public.

const FEATURE_LABELS: Record<string, string> = {
  updates: "deal alerts & market updates",
  favorites: "saved favorite properties",
  plan: "a personalized investment plan",
  inbox: "direct messaging with our AI agent",
};

const FALLBACK = (first: string, interest: string) =>
  `Hi ${first}, I'm Eden Skye with Hidden Property Intel. You're signed up for ${interest}. Want to hear about our deal alerts, smart-contract escrow, or AI deal calculator? Reply YES. — Eden Skye, HPI`;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const sr = base44.asServiceRole.entities;
    const body = await req.json().catch(() => ({}));
    const { first_name, last_name, email, phone, feature } = body;

    if (!first_name || first_name.trim().length < 1)
      return Response.json({ error: "First name is required" }, { status: 400 });
    if (!email && !phone)
      return Response.json({ error: "Email or phone is required" }, { status: 400 });

    const featureKey = FEATURE_LABELS[feature] ? feature : "updates";
    const interest = FEATURE_LABELS[featureKey];
    const fullName = `${first_name} ${last_name || ""}`.trim();

    // 1. CRM — create the lead
    const lead = await sr.InvestorLead.create({
      name: fullName,
      email: email || "",
      phone: phone || "",
      source: `v2_nav_${featureKey}`,
      notes: `Signed up for ${interest} via V2 rail lead capture.`,
      outreach_status: "new",
      automation_enabled: true,
      follow_up_enabled: true,
      follow_up_frequency_days: 3,
    });

    // 2. AI agent (Eden Skye) writes a personalized intro
    const prompt = `You are Eden Skye, Executive Assistant at Hidden Property Intel — an AI-powered off-market distressed real estate platform. A new lead named ${first_name} just signed up for ${interest}. Write a warm, concise welcome SMS introducing yourself, confirm what they signed up for, and ask if they'd like to learn about our other services (deal alerts, smart-contract escrow, deal calculator, skip tracing, AI negotiation). Keep it under 300 characters. No emojis. Sign "Eden Skye, HPI".`;
    let aiMsg = "";
    try {
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
      aiMsg = typeof llm === "string" ? llm : (llm && llm.text) || "";
    } catch {
      aiMsg = "";
    }
    if (!aiMsg || aiMsg.length < 10) aiMsg = FALLBACK(first_name, interest);

    // 3. Welcome email (always, when email present)
    let emailSent = false;
    if (email) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          from_name: "Eden Skye — Hidden Property Intel",
          subject: `Welcome to Hidden Property Intel, ${first_name}!`,
          body: `${aiMsg}\n\n— Eden Skye\nHidden Property Intel\nhttps://my-property-intel.base44.app`,
        });
        emailSent = true;
        await sr.CommsEvent.create({
          lead_id: lead.id,
          event_type: "sent",
          channel: "email",
          direction: "outbound",
          status: "success",
          message_snippet: aiMsg.slice(0, 200),
        });
      } catch (e: any) {
        await sr.CommsEvent.create({
          lead_id: lead.id,
          event_type: "failed",
          channel: "email",
          direction: "outbound",
          status: "failed",
          error_detail: String(e?.message || e),
        });
      }
    }

    // 4. SMS/MMS via Telnyx (when phone + active sender number)
    let smsSent = false;
    if (phone) {
      const telnyxKey = secrets.get("TELNYX_API_KEY");
      const nums = await sr.PhoneNumber.filter({ status: "active" }).catch(() => []);
      const fromNumber = nums[0]?.number;
      if (telnyxKey && fromNumber) {
        try {
          const r = await fetch("https://api.telnyx.com/v2/messages", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${telnyxKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ from: fromNumber, to: phone, text: aiMsg }),
          });
          smsSent = r.ok;
          await sr.CommsEvent.create({
            lead_id: lead.id,
            event_type: smsSent ? "sent" : "failed",
            channel: "sms",
            direction: "outbound",
            status: smsSent ? "success" : "failed",
            message_snippet: aiMsg.slice(0, 200),
            error_detail: smsSent ? "" : `Telnyx HTTP ${r.status}`,
          });
        } catch (e: any) {
          await sr.CommsEvent.create({
            lead_id: lead.id,
            event_type: "failed",
            channel: "sms",
            direction: "outbound",
            status: "failed",
            error_detail: String(e?.message || e),
          });
        }
      } else {
        await sr.CommsEvent.create({
          lead_id: lead.id,
          event_type: "failed",
          channel: "sms",
          direction: "outbound",
          status: "failed",
          error_detail: "No active Telnyx sender number configured",
        });
      }
    }

    // 5. Mark lead contacted
    await sr.InvestorLead.update(lead.id, {
      outreach_status: "contacted",
      last_contacted: new Date().toISOString(),
      contact_count: 1,
      last_outreach_subject: `Welcome — ${interest}`,
      last_outreach_body: aiMsg,
    });

    return Response.json({
      success: true,
      lead_id: lead.id,
      email_sent: emailSent,
      sms_sent: smsSent,
      message: aiMsg,
    });
  } catch (error) {
    console.error("captureLead error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}