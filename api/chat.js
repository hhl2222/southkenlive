// "Ask" box backend: sends the visitor's question plus live weather + trains to OpenAI.
// Needs two Vercel environment variables:
//   OPENAI_API_KEY  – your key from platform.openai.com
//   OPENAI_MODEL    – the model ID to use (copy it from platform.openai.com/docs/models)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;
  if (!apiKey || !model) {
    return res.status(500).json({ error: "OPENAI_API_KEY and OPENAI_MODEL must be set in Vercel" });
  }

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const question = String(body?.question || "").trim().slice(0, 500);
  if (!question) return res.status(400).json({ error: "Ask a question" });

  // Pull live data from this app's own endpoints
  const base = `https://${req.headers.host}`;
  const [weather, arrivals] = await Promise.all([
    fetch(`${base}/api/weather`).then((r) => r.json()).catch(() => null),
    fetch(`${base}/api/arrivals`).then((r) => r.json()).catch(() => null),
  ]);

  const trains = (arrivals?.trains || []).slice(0, 15).map((t) =>
    `${t.lineName} to ${t.destination}, ${t.platform}, in ${Math.round(t.seconds / 60)} min`
  );
  const status = (arrivals?.status || []).map((l) => `${l.name}: ${l.status}${l.reason ? " – " + l.reason : ""}`);
  const now = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  const context = [
    `Current time in London: ${now}`,
    weather && !weather.error
      ? `Weather: ${weather.temperature}°C (feels ${weather.feelsLike}°C), wind ${weather.wind} km/h, humidity ${weather.humidity}%, today's high ${weather.high}°C / low ${weather.low}°C, WMO code ${weather.code}`
      : "Weather: unavailable",
    "Line status:", ...(status.length ? status : ["unavailable"]),
    "Next trains at South Kensington:", ...(trains.length ? trains : ["none predicted / unavailable"]),
  ].join("\n");

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        max_completion_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are a friendly helper on a live board for South Kensington tube station in London. " +
              "Answer briefly (2-4 sentences) using the live data below. If the data doesn't cover the question, say so " +
              "and give general London travel advice.\n\n" + context,
          },
          { role: "user", content: question },
        ],
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `OpenAI responded ${r.status}`);
    res.status(200).json({ answer: d.choices?.[0]?.message?.content?.trim() || "No answer returned." });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
}
