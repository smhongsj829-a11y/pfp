module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const code = process.env.ACCESS_CODE;
  if (code && req.headers["x-access-code"] !== code) {
    return res.status(401).json({ error: "invalid access code" });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: "ANTHROPIC_API_KEY is not set" });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const prompt = String(body.prompt || "").slice(0, 12000);
  const max = Math.min(Number(body.max) || 300, 600);
  if (!prompt) return res.status(400).json({ error: "prompt required" });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.MODEL || "claude-haiku-4-5-20251001",
        max_tokens: max,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!r.ok) return res.status(502).json({ error: "upstream " + r.status });
    const data = await r.json();
    const text = (data.content || []).map((c) => c.text || "").join("");
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "server error" });
  }
};
