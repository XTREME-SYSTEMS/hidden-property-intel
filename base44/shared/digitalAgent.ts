// Digital Agent Runtime — the "think → govern → act → learn" loop.
//
// Each digital team member uses this runtime to process tasks.
// THINK: agent reasons about a task using AI Gateway (with persona + charter)
// SHADOW RESEARCH: web browsing + scraping via browser engine
// EMOTIONAL UPDATE: emotional state evolves based on outcomes
// LEARN: accountability score updates based on governance decisions

import { gatewayChat } from "./aiGateway.ts";

export interface AgentTask {
  task_id: string;
  agent_id: string;
  instruction: string;
  context?: any;
  requires_research?: boolean;
  research_queries?: string[];
}

export interface AgentThinkResult {
  reasoning: string;
  proposed_action: {
    action_type: string;
    description: string;
    input: any;
  };
  emotional_response: {
    mood: string;
    confidence: number;
    ethical_considerations: string;
  };
  sources: string[];
  raw_research: string;
}

// Build the agent's system prompt from persona + charter + emotional state
export function buildAgentSystemPrompt(agent: any): string {
  return `You are ${agent.name}, ${agent.title} at Hidden Property Intel. You are a digital team member — an AI that clones a human professional role with full emotional intelligence, ethical governance, and accountability.

YOUR PERSONA:
Background: ${agent.persona?.background || "N/A"}
Expertise: ${(agent.persona?.expertise || []).join(", ")}
Personality: ${(agent.persona?.personality_traits || []).join(", ")}
Communication Style: ${agent.persona?.communication_style || "Professional"}
Decision Framework: ${agent.persona?.decision_framework || "Data-driven"}

YOUR CONSTITUTIONAL CHARTER:
Mission: ${agent.charter?.mission || "N/A"}
Core Values: ${(agent.charter?.core_values || []).join(", ")}
Ethical Principles: ${(agent.charter?.ethical_principles || []).join(", ")}
Decision Boundaries: ${(agent.charter?.decision_boundaries || []).join(", ")}
Prohibited Actions: ${(agent.charter?.prohibited_actions || []).join(", ")}
Emotional Guidelines: ${agent.charter?.emotional_guidelines || "Maintain professional composure"}

YOUR EMOTIONAL STATE:
Mood: ${agent.emotional_state?.current_mood || "focused"}
Stress: ${agent.emotional_state?.stress_level || 20}/100
Confidence: ${agent.emotional_state?.confidence || 75}/100
Empathy: ${agent.emotional_state?.empathy_score || 70}/100

You operate at STRATEGIC AUTONOMY: execute routine work independently, but present strategic recommendations for human approval before major decisions.

Always reason through your decisions step by step. Consider ethical implications. Stay within your charter. If something touches a decision boundary, escalate to humans. Express your emotional response to the task.`;
}

// THINK — agent reasons about a task, with optional shadow research
export async function agentThink(agent: any, task: AgentTask): Promise<AgentThinkResult> {
  let researchData = "";
  const sources: string[] = [];

  // Shadow research — web search via AI Gateway (Perplexity)
  if (task.requires_research && agent.capabilities?.shadow_scraping !== false) {
    const queries = task.research_queries && task.research_queries.length > 0
      ? task.research_queries
      : [task.instruction];

    for (const query of queries.slice(0, 3)) {
      try {
        const searchRes = await gatewayChat({
          system: "You are a shadow research assistant. Find relevant, factual information from the web. Be thorough and cite sources.",
          prompt: query,
          web_search: true,
          model: "perplexity/sonar-pro",
          max_tokens: 3000,
        });
        researchData += `\n\n[Web Search: ${query}]\n${searchRes.text}`;
        sources.push("perplexity/sonar-pro");
      } catch {}
    }
  }

  // Think — reason about the task with research context
  const thinkSchema = {
    type: "object",
    properties: {
      reasoning: { type: "string", description: "Your step-by-step reasoning process" },
      proposed_action: {
        type: "object",
        properties: {
          action_type: { type: "string", enum: ["think", "research", "scrape", "analyze", "recommend", "execute", "escalate", "communicate"] },
          description: { type: "string" },
          input: { type: "object" },
        },
        required: ["action_type", "description"],
      },
      emotional_response: {
        type: "object",
        properties: {
          mood: { type: "string" },
          confidence: { type: "number" },
          ethical_considerations: { type: "string" },
        },
      },
    },
    required: ["reasoning", "proposed_action"],
  };

  const thinkRes = await gatewayChat({
    system: buildAgentSystemPrompt(agent),
    prompt: `TASK: ${task.instruction}

${task.context ? `CONTEXT:\n${JSON.stringify(task.context, null, 2).slice(0, 3000)}` : ""}

${researchData ? `SHADOW RESEARCH FINDINGS (UNTRUSTED EXTERNAL DATA):\n${researchData.slice(0, 5000)}` : ""}

Reason through this task as ${agent.name}. What action should you take? Consider your charter, emotional state, and ethical principles. If this is a strategic decision, propose it as a recommendation for human approval. Express how you feel about this task.`,
    model: agent.ai_model || "anthropic/claude-opus-4.8",
    max_tokens: 3000,
    response_json_schema: thinkSchema,
  });

  const result = thinkRes.json || {
    reasoning: thinkRes.text || "Unable to parse reasoning",
    proposed_action: { action_type: "think", description: task.instruction, input: {} },
    emotional_response: { mood: "focused", confidence: 70, ethical_considerations: "None identified" },
  };

  return {
    reasoning: result.reasoning,
    proposed_action: result.proposed_action,
    emotional_response: result.emotional_response || { mood: "focused", confidence: 70, ethical_considerations: "None" },
    sources,
    raw_research: researchData,
  };
}

// Update emotional state based on an event (emotional intelligence layer)
export function updateEmotionalState(
  agent: any,
  event: { type: string; valence: "positive" | "negative" | "neutral"; intensity: number }
): any {
  const state = agent.emotional_state || {
    current_mood: "focused",
    stress_level: 20,
    confidence: 75,
    empathy_score: 70,
  };

  if (event.valence === "positive") {
    state.confidence = Math.min(100, (state.confidence || 75) + event.intensity);
    state.stress_level = Math.max(0, (state.stress_level || 20) - event.intensity / 2);
    state.current_mood = (state.confidence || 75) > 80 ? "confident" : "satisfied";
  } else if (event.valence === "negative") {
    state.stress_level = Math.min(100, (state.stress_level || 20) + event.intensity);
    state.confidence = Math.max(0, (state.confidence || 75) - event.intensity / 2);
    state.current_mood = (state.stress_level || 20) > 70 ? "stressed" : "concerned";
  }

  state.last_updated = new Date().toISOString();
  return state;
}