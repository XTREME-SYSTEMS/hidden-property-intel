import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { gatewayChat, isGatewayConfigured } from "../../shared/aiGateway.ts";

// Xtreme Communication System — unified campaign, conversation, template, and event management.
// Integrates multi-channel outreach (email, SMS, voice, WhatsApp, social) with AI-powered
// template generation and conversation tracking.

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || "dashboard";
    const sr = base44.asServiceRole.entities;

    // ─── DASHBOARD — overview stats ───
    if (action === "dashboard") {
      const [campaigns, templates, conversations, events] = await Promise.all([
        sr.Campaign.list("-created_date", 50),
        sr.CommunicationTemplate.list("-created_date", 50),
        sr.Conversation.list("-created_date", 50),
        sr.CommsEvent.list("-created_date", 100),
      ]);

      const activeCampaigns = campaigns.filter((c: any) => c.status === "running" || c.status === "scheduled");
      const activeConversations = conversations.filter((c: any) => c.status === "active" || c.status === "waiting_reply");
      const totalSent = events.filter((e: any) => e.event_type === "sent").length;
      const totalDelivered = events.filter((e: any) => e.event_type === "delivered").length;
      const totalReplied = events.filter((e: any) => e.event_type === "replied").length;
      const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;
      const responseRate = totalDelivered > 0 ? Math.round((totalReplied / totalDelivered) * 100) : 0;

      return Response.json({
        campaigns: { total: campaigns.length, active: activeCampaigns.length },
        templates: { total: templates.length, active: templates.filter((t: any) => t.active).length },
        conversations: { total: conversations.length, active: activeConversations.length },
        events: { total: events.length, sent: totalSent, delivered: totalDelivered, replied: totalReplied, delivery_rate: deliveryRate, response_rate: responseRate },
        ai_gateway: { configured: isGatewayConfigured() },
      });
    }

    // ─── CREATE CAMPAIGN ───
    if (action === "create_campaign") {
      const { name, description, channel, message_template, target_audience, ai_persona, schedule_type, scheduled_at } = body;
      if (!name) return Response.json({ error: "name is required" }, { status: 400 });

      const campaign = await sr.Campaign.create({
        name,
        description: description || "",
        channel: channel || "email",
        message_template: message_template || "",
        target_audience: target_audience || "investors",
        ai_persona: ai_persona || "Eden Skye",
        status: "draft",
        schedule_type: schedule_type || "immediate",
        scheduled_at: scheduled_at || null,
        total_recipients: 0,
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        response_count: 0,
        compliance_verified: false,
      });

      return Response.json({ campaign });
    }

    // ─── START CAMPAIGN ───
    if (action === "start_campaign") {
      const { campaign_id } = body;
      if (!campaign_id) return Response.json({ error: "campaign_id is required" }, { status: 400 });

      const campaign = await sr.Campaign.get(campaign_id);
      if (!campaign) return Response.json({ error: "Campaign not found" }, { status: 404 });

      const updated = await sr.Campaign.update(campaign_id, {
        status: "running",
        started_at: new Date().toISOString(),
      });

      return Response.json({ campaign: updated });
    }

    // ─── AI GENERATE TEMPLATE ───
    if (action === "generate_template") {
      const { channel, situation, tone, target_audience, industry, ai_persona } = body;

      const prompt = `You are ${ai_persona || "Eden Skye"}, an expert real estate communication specialist.
Generate a ${channel || "email"} template for ${situation || "outreach"} to ${target_audience || "investors"}.
Tone: ${tone || "professional"}. Industry: ${industry || "real estate investment"}.

Return JSON with:
{
  "name": "short template name",
  "subject_line": "email subject (if email channel)",
  "template_body": "the full message body",
  "psychology_notes": "why this template works — psychological triggers and response drivers",
  "high_response_words": ["word1", "word2", ...],
  "words_to_avoid": ["word1", "word2", ...],
  "effectiveness_score": 0-100,
  "compliance_notes": "Fair Housing / RESPA compliance notes"
}`;

      let result;
      if (isGatewayConfigured()) {
        const gwResult = await gatewayChat({
          prompt,
          model: "anthropic/claude-sonnet-5",
          temperature: 0.7,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              subject_line: { type: "string" },
              template_body: { type: "string" },
              psychology_notes: { type: "string" },
              high_response_words: { type: "array", items: { type: "string" } },
              words_to_avoid: { type: "array", items: { type: "string" } },
              effectiveness_score: { type: "number" },
              compliance_notes: { type: "string" },
            },
          },
        });
        try {
          result = JSON.parse(gwResult.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim());
        } catch {
          const m = gwResult.text.match(/\{[\s\S]*\}/);
          result = m ? JSON.parse(m[0]) : null;
        }
      } else {
        result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              subject_line: { type: "string" },
              template_body: { type: "string" },
              psychology_notes: { type: "string" },
              high_response_words: { type: "array", items: { type: "string" } },
              words_to_avoid: { type: "array", items: { type: "string" } },
              effectiveness_score: { type: "number" },
              compliance_notes: { type: "string" },
            },
          },
        });
      }

      if (!result) return Response.json({ error: "Failed to generate template" }, { status: 500 });

      const template = await sr.CommunicationTemplate.create({
        name: result.name,
        industry: industry || "real_estate",
        channel: channel || "email",
        situation: situation || "outreach",
        tone: tone || "professional",
        target_audience: target_audience || "investor",
        template_body: result.template_body,
        subject_line: result.subject_line || "",
        psychology_notes: result.psychology_notes || "",
        high_response_words: result.high_response_words || [],
        words_to_avoid: result.words_to_avoid || [],
        effectiveness_score: result.effectiveness_score || 0,
        compliance_notes: result.compliance_notes || "",
        ai_generated: true,
        active: true,
      });

      return Response.json({ template, source: isGatewayConfigured() ? "vercel_ai_gateway" : "invoke_llm" });
    }

    // ─── LOG EVENT ───
    if (action === "log_event") {
      const { conversation_id, campaign_id, lead_id, event_type, channel, direction, status, message_snippet, error_detail } = body;

      const event = await sr.CommsEvent.create({
        conversation_id: conversation_id || null,
        campaign_id: campaign_id || null,
        lead_id: lead_id || null,
        event_type: event_type || "sent",
        channel: channel || "email",
        direction: direction || "outbound",
        status: status || "success",
        message_snippet: message_snippet || "",
        error_detail: error_detail || "",
      });

      // Update campaign counters if linked
      if (campaign_id) {
        const campaign = await sr.Campaign.get(campaign_id);
        if (campaign) {
          const updates: any = {};
          if (event_type === "sent") updates.sent_count = (campaign.sent_count || 0) + 1;
          if (event_type === "delivered") updates.delivered_count = (campaign.delivered_count || 0) + 1;
          if (event_type === "failed") updates.failed_count = (campaign.failed_count || 0) + 1;
          if (event_type === "opt_out") updates.opt_out_count = (campaign.opt_out_count || 0) + 1;
          if (event_type === "replied") updates.response_count = (campaign.response_count || 0) + 1;
          if (Object.keys(updates).length > 0) await sr.Campaign.update(campaign_id, updates);
        }
      }

      return Response.json({ event });
    }

    // ─── GET CONVERSATION ───
    if (action === "get_conversation") {
      const { conversation_id } = body;
      if (!conversation_id) return Response.json({ error: "conversation_id is required" }, { status: 400 });

      const conversation = await sr.Conversation.get(conversation_id);
      if (!conversation) return Response.json({ error: "Conversation not found" }, { status: 404 });

      const events = await sr.CommsEvent.filter({ conversation_id });

      return Response.json({ conversation, events });
    }

    // ─── AI REPLY SUGGESTION ───
    if (action === "suggest_reply") {
      const { conversation_id, inbound_message } = body;
      if (!conversation_id && !inbound_message) return Response.json({ error: "conversation_id or inbound_message required" }, { status: 400 });

      let conversation: any = null;
      let context = "";
      if (conversation_id) {
        conversation = await sr.Conversation.get(conversation_id);
        if (conversation?.messages?.length) {
          context = conversation.messages.slice(-5).map((m: any) => `${m.direction}: ${m.content}`).join("\n");
        }
      }

      const prompt = `You are Eden Skye, Executive Assistant at Hidden Property Intel. A ${conversation?.lead_type || "contact"} has sent a message. Suggest a professional, warm reply.

${context ? "Recent conversation:\n" + context + "\n" : ""}
New message: "${inbound_message || ""}"

Return JSON: { "reply": "the suggested reply", "sentiment": "positive|neutral|negative", "next_action": "what to do next" }`;

      let result;
      if (isGatewayConfigured()) {
        const gwResult = await gatewayChat({
          prompt,
          model: "anthropic/claude-sonnet-5",
          temperature: 0.6,
          response_json_schema: {
            type: "object",
            properties: {
              reply: { type: "string" },
              sentiment: { type: "string" },
              next_action: { type: "string" },
            },
          },
        });
        try { result = JSON.parse(gwResult.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()); } catch { result = { reply: gwResult.text }; }
      } else {
        result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: { reply: { type: "string" }, sentiment: { type: "string" }, next_action: { type: "string" } },
          },
        });
      }

      return Response.json({ suggestion: result });
    }

    return Response.json({ error: "Unknown action. Use: dashboard, create_campaign, start_campaign, generate_template, log_event, get_conversation, suggest_reply" }, { status: 400 });
  } catch (error) {
    console.error("xtremeComms error", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}