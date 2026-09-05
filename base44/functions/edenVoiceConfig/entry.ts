import { createClientFromRequest } from 'npm:@base44/sdk@0.8.46';

// Eden Skye Voice Configuration & Orchestration
// Uses built-in GenerateSpeech (TTS) and TranscribeAudio (STT) integrations.
// No external Telnyx key required — fully functional with platform integrations.

const VOICES = {
  river: { desc: 'calm, neutral', persona: 'steady and composed' },
  honey: { desc: 'warm, soft', persona: 'genuinely caring and gentle' },
  sunny: { desc: 'bright, upbeat', persona: 'friendly and energetic' },
  storm: { desc: 'formal, authoritative', persona: 'professional and precise' },
  spark: { desc: 'energetic, quick', persona: 'sharp and quick-witted' },
};

// Eden's default voice — warm, intelligent, calm (matches her profile)
const DEFAULT_VOICE = 'honey';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const action = body.action;

    // VOICES — list available TTS voices
    if (action === 'voices') {
      return Response.json({ voices: VOICES, default: DEFAULT_VOICE });
    }

    // SYNTHESIZE — text → speech (returns MP3 URL)
    if (action === 'synthesize') {
      const { text, voice, language_code } = body;
      if (!text) return Response.json({ error: 'text is required' }, { status: 400 });
      const res = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text: text.slice(0, 5000),
        voice: voice || DEFAULT_VOICE,
        language_code: language_code || 'en',
      });
      return Response.json({ url: res.url, voice: voice || DEFAULT_VOICE, chars: text.length });
    }

    // TRANSCRIBE — audio URL → text (for inbound voicemail processing)
    if (action === 'transcribe') {
      const { audio_url } = body;
      if (!audio_url) return Response.json({ error: 'audio_url is required' }, { status: 400 });
      const res = await base44.asServiceRole.integrations.Core.TranscribeAudio({ audio_url });
      return Response.json({ transcript: res });
    }

    // ORCHESTRATE — given a lead + context, generate what Eden should say on a call, then synthesize it
    if (action === 'orchestrate') {
      const { contact_name, contact_type, context, call_purpose, voice } = body;
      if (!contact_name || !call_purpose) {
        return Response.json({ error: 'contact_name and call_purpose are required' }, { status: 400 });
      }

      const prompt = `You are Eden Skye, Executive Assistant at Hidden Property Intel. You are about to make a ${call_purpose} phone call to ${contact_name}, a ${contact_type || 'contact'}.

Context: ${context || 'No additional context provided.'}

Write a natural, warm, professional voice script for this call. It should:
- Open with a warm, genuine greeting (use their name)
- State who you are and why you're calling in one clear sentence
- Be conversational — not robotic or scripted-sounding
- Be concise (60-120 words — about 30-60 seconds of speech)
- End with a clear, gentle call to action or question
- Sound like a real human assistant — warm, intelligent, calm

${contact_type === 'owner' || contact_type === 'heir' ? 'This person may be in a difficult life situation. Be extra empathetic, patient, and never pushy. Lead with care, not business.' : ''}
${contact_type === 'investor' ? 'Be peer-level, direct, and value-first. Investors appreciate efficiency.' : ''}

Return JSON: { "script": "the full voice script" }`;

      const llmRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        model: 'claude_sonnet_4_6',
        response_json_schema: {
          type: 'object',
          properties: { script: { type: 'string' } },
        },
      });

      const script = llmRes.script;
      const speechRes = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text: script,
        voice: voice || DEFAULT_VOICE,
        language_code: 'en',
      });

      return Response.json({
        script,
        audio_url: speechRes.url,
        voice: voice || DEFAULT_VOICE,
        contact_name,
        call_purpose,
      });
    }

    // TEST — generate a sample voice clip with Eden's default greeting
    if (action === 'test') {
      const { voice } = body;
      const sampleText = body.text || `Hi, this is Eden Skye with Hidden Property Intel. I'm calling about a property in your area — is this a good time to talk for just a couple of minutes?`;
      const res = await base44.asServiceRole.integrations.Core.GenerateSpeech({
        text: sampleText,
        voice: voice || DEFAULT_VOICE,
        language_code: 'en',
      });
      return Response.json({
        url: res.url,
        voice: voice || DEFAULT_VOICE,
        text: sampleText,
      });
    }

    return Response.json({ error: 'Unknown action. Use: voices, synthesize, transcribe, orchestrate, test' }, { status: 400 });
  } catch (error) {
    console.error('edenVoiceConfig error', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}