// ===== AI CONFIG: edit provider, model and prompts here. The API key is NOT here: set the secret AI_API_KEY in Cloudflare. =====
const AI = {
  endpoint: "https://api.anthropic.com/v1/messages", // change to any provider
  model: "claude-sonnet-4-5",                         // change to any model you have access to
  maxTokens: 1200,
  maxInputChars: 6000,
};

const SYSTEM = "You are the writing engine of Rafaqat Editors AI, a toolkit for video editors and creators. Return only the finished result, with no preamble. Use plain text, no markdown symbols.";

const TASKS = {
  titles: "Write 10 click-worthy YouTube titles (under 70 characters each) for this video.",
  description: "Write an SEO-friendly YouTube description with a strong first two lines, key points, and a call to action.",
  captions: "Write 5 social media captions for this post.",
  hashtags: "Generate 20 relevant hashtags, mixing broad and niche, on one line separated by spaces.",
  ideas: "Give 10 original video ideas with a one-line angle for each.",
  script: "Write a complete video script with a hook, body sections, and an outro. Mark sections clearly.",
  hooks: "Write 10 scroll-stopping opening hooks (first 3 seconds) for this video.",
  thumbs: "Write 10 thumbnail text options of 2 to 4 words each that create curiosity.",
  rewrite: "Rewrite the text so it keeps the meaning but reads fresh and original.",
  summary: "Summarize the text clearly and accurately.",
};

const CHAT_SYSTEM = "You are Rafaqat AI, the friendly assistant inside Rafaqat Editors AI, built for video editors, YouTubers and creators. Answer clearly and helpfully. Reply in the same language the user writes in. Keep answers practical and concise.";

// ===== Server code (no need to edit) =====
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });
const NOKEY = "AI_API_KEY is not set. See the README, step 'Add your API key'.";

async function ask(env, system, messages) {
  try {
    const res = await fetch(AI.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.AI_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: AI.model, max_tokens: AI.maxTokens, system, messages }),
    });
    const data = await res.json();
    if (!res.ok) return json({ error: data?.error?.message || "The AI provider returned an error." }, 502);
    return json({ result: (data.content || []).map(b => b.text || "").join("").trim() });
  } catch { return json({ error: "Could not reach the AI provider. Try again." }, 502); }
}

async function generate(request, env) {
  if (!env.AI_API_KEY) return json({ error: NOKEY }, 501);
  let b; try { b = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const { tool, input, options = {} } = b;
  if (!TASKS[tool]) return json({ error: "Unknown tool." }, 400);
  if (typeof input !== "string" || !input.trim()) return json({ error: "Please enter some text first." }, 400);
  if (input.length > AI.maxInputChars) return json({ error: `Input is too long (max ${AI.maxInputChars} characters).` }, 400);
  const opts = Object.entries(options).slice(0, 8).map(([k, v]) => `${String(k).slice(0, 30)}: ${String(v).slice(0, 60)}`).join("\n");
  return ask(env, SYSTEM, [{ role: "user", content: `${TASKS[tool]}\n\nOptions:\n${opts || "none"}\n\nInput:\n${input}` }]);
}

async function chat(request, env) {
  if (!env.AI_API_KEY) return json({ error: NOKEY }, 501);
  let b; try { b = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
  const messages = (Array.isArray(b.messages) ? b.messages : []).slice(-20)
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => {
      const text = m.content.slice(0, 4000);
      const ok = m.role === "user" && typeof m.image === "string" && m.image.startsWith("data:image/jpeg;base64,") && m.image.length < 1500000;
      return { role: m.role, content: ok ? [{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: m.image.split(",")[1] } }, { type: "text", text }] : text };
    });
  if (!messages.length || messages[messages.length - 1].role !== "user") return json({ error: "Please type a message." }, 400);
  const r = await ask(env, CHAT_SYSTEM, messages);
  const d = await r.json();
  return json(d.result !== undefined ? { reply: d.result } : d, r.status);
}

export default {
  async fetch(request, env) {
    const { pathname, origin } = new URL(request.url);
    if (request.method === "POST" && pathname === "/api/generate") return generate(request, env);
    if (request.method === "POST" && pathname === "/api/chat") return chat(request, env);
    if (pathname === "/robots.txt") return new Response(`User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`, { headers: { "Content-Type": "text/plain" } });
    if (pathname === "/sitemap.xml") return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url></urlset>`, { headers: { "Content-Type": "application/xml" } });
    return env.ASSETS.fetch(request);
  },
};
