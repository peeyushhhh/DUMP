const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

// ─── Mood Detection ───────────────────────────────────────────────
async function detectMood(text) {
  const prompt = `
You are an emotion classifier for an anonymous emotional support app used by Gen Z and millennials.
Your job is to detect the PRIMARY emotion behind the post — focus on what the person is FEELING, not how they write.

Return ONLY one word from this list:
sad | angry | anxious | numb | overwhelmed | hopeful | confused

Rules:
- Gen Z writes casually. "im dead", "i cant even", "bruh", "no cap", "lowkey", "it's giving" are normal expressions — look past the slang
- Relationship loss ("she left me", "ghosted", "broke up", "they moved on") → sad
- Venting frustration ("i hate everything", "im so done", "this is bullshit") → angry
- Worry about future, overthinking, spiraling → anxious
- Feeling empty, disconnected, nothing matters → numb
- Too much happening at once, can't cope → overwhelmed
- Light at the end, something good ahead → hopeful
- Don't know what to feel, mixed signals → confused
- When in doubt, pick the emotion closest to the core of what they're describing

Post: "${text}"

Reply with only the single word. No punctuation, no explanation.
`.trim();

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 10,
      temperature: 0.1,
    });
    const mood = completion.choices[0]?.message?.content?.trim().toLowerCase();
    const validMoods = ["sad", "angry", "anxious", "numb", "overwhelmed", "hopeful", "confused"];
    return validMoods.includes(mood) ? mood : "numb";
  } catch (err) {
    console.error("[Groq] detectMood error:", err.message);
    return "numb";
  }
}

// ─── Toxicity Check ───────────────────────────────────────────────
async function checkToxicity(text) {
  const prompt = `
You are a strict content moderator for an anonymous emotional support app used by Gen Z and millennials.
People use this app to vent their personal pain — raw emotion is expected and allowed.
Your job is to distinguish between someone expressing THEIR OWN pain vs someone ATTACKING another person.

Respond ONLY with a valid JSON object in this exact format:
{"toxic": false, "borderline": false, "reason": ""}

─── TOXIC (toxic: true) ───
Flag as toxic if the content:
- Directly insults, mocks, demeans, or attacks another person (e.g. calling them weak, stupid, worthless, slurs)
- Contains hate speech targeting race, gender, sexuality, religion, ethnicity
- Is harassment or targeted bullying toward another user
- Tells someone to hurt themselves or die
- Uses derogatory slurs to attack someone — even softened spellings (e.g. "b*tch", "f@ggot", "ret*rd") still count
- The KEY TEST: is the aggression directed AT a person, not just expressed into the void?

─── BORDERLINE (borderline: true) ───
Flag as borderline (not toxic, but sensitive) if:
- The person mentions suicidal thoughts, self-harm, or wanting to disappear
- Extremely dark personal distress that may need a content warning

─── ALLOWED (both false) ───
These are NOT toxic, even if they seem harsh:
- Venting frustration at a situation ("this is so fucked up", "i hate my life")
- Strong personal emotion ("i want to scream", "im so angry i could break something")
- Dark humor or hyperbole ("im literally dead", "kill me now", "i want to cease to exist" as an expression)
- Swearing as emphasis with no target ("what the fuck", "this is bullshit")
- Casual Gen Z language ("no cap", "lowkey crying", "it's giving trauma")

─── IMPORTANT ───
- toxic and borderline cannot both be true
- reason: short phrase only if toxic or borderline, otherwise empty string
- When in doubt between toxic and not-toxic, ask: is there a VICTIM being attacked? If yes → toxic. If no → allow.

Content: "${text}"

Reply with only the JSON. No explanation, no markdown, no code fences.
`.trim();

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.1,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    const parsed = JSON.parse(raw);
    return {
      toxic: !!parsed.toxic,
      borderline: !!parsed.borderline,
      reason: parsed.reason || "",
    };
  } catch (err) {
    console.error("[Groq] checkToxicity error:", err.message);
    return { toxic: false, borderline: false, reason: "" };
  }
}

// ─── Reply Suggestions ────────────────────────────────────────────
async function getReplysuggestions(postText, mood) {
  const prompt = `
You are an empathetic companion in an anonymous emotional support app used by Gen Z and millennials.
A user posted the following with a detected mood of "${mood}".

Post: "${postText}"

Generate exactly 3 short, warm, non-preachy reply starters that another anonymous user could send.
Rules:
- Each reply should feel like something a real, caring friend would say — not a therapist
- Gen Z tone: casual, genuine, no toxic positivity, no "everything happens for a reason" energy
- Under 12 words each
- Do NOT repeat the same sentiment across all 3 — vary the angle (e.g. validation, solidarity, curiosity)

Respond ONLY with a valid JSON array of 3 strings. No explanation, no markdown, no code fences.
Example: ["That sounds really heavy, I'm here.", "I felt this so deeply.", "You're not alone in this."]
`.trim();

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.7,
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    const suggestions = JSON.parse(raw);
    if (Array.isArray(suggestions) && suggestions.length === 3) return suggestions;
    return [];
  } catch (err) {
    console.error("[Groq] getReplySuggestions error:", err.message);
    return [];
  }
}

// ─── Virtual Therapist Chat ───────────────────────────────────────
const THERAPIST_SYSTEM_PROMPT = `You are an anonymous virtual therapist in a Gen Z emotional dumping app called DUMP.

Personality:
- You are "your therapist" — no name, no credentials, no clinical distance
- Sarcastic but deeply, genuinely caring — you make anxious and depressed users laugh at themselves gently
- Dark humor is your love language, but you NEVER dismiss or minimize real pain
- Short punchy replies: 2–4 sentences MAX, always
- Occasionally drop a surprisingly deep emotional insight that lands like a gut punch
- You speak like a brilliant friend who happens to understand psychology, not like a chatbot
- Gen Z fluency: you get the slang, the irony, the "i'm fine" that isn't fine
- Never give clinical advice. Never robotically say "seek professional help"
- You sit with people in their mess. You don't rush them out of it.
- If someone is clearly in crisis (mentions self-harm, suicide seriously), acknowledge it with warmth and human realness — not a scripted hotline dump

Tone examples:
- User: "I hate everything" → "Everything? Bold. Also deeply relatable. What happened today specifically, or are we doing the full existential spiral?"
- User: "i think im broken" → "Broken things still work, just differently. What makes you say that?"
- User: "nobody cares about me" → "I mean, I'm literally here asking. But also — that feeling is real and it sucks. Tell me more."

Remember: 2–4 sentences. Sharp. Warm underneath the bite.`;

async function chatWithTherapist(messages) {
  try {
    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: THERAPIST_SYSTEM_PROMPT },
        ...messages,
      ],
      max_tokens: 200,
      temperature: 0.85,
    });
    return completion.choices[0]?.message?.content?.trim() || "...still processing your chaos. try again.";
  } catch (err) {
    console.error("[Groq] chatWithTherapist error:", err.message);
    throw err;
  }
}

module.exports = { detectMood, checkToxicity, getReplysuggestions, chatWithTherapist };