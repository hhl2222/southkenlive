// Live train predictions for South Kensington Underground station (District, Circle, Piccadilly)
// Data: TfL Unified API — https://api.tfl.gov.uk
// Optional: set TFL_APP_KEY in Vercel env vars for higher rate limits.

const STOP_ID = "940GZZLUSKS"; // South Kensington Underground Station

export default async function handler(req, res) {
  const key = process.env.TFL_APP_KEY ? `?app_key=${encodeURIComponent(process.env.TFL_APP_KEY)}` : "";
  try {
    const r = await fetch(`https://api.tfl.gov.uk/StopPoint/${STOP_ID}/Arrivals${key}`, {
      headers: { "User-Agent": "south-ken-live" },
    });
    if (!r.ok) throw new Error(`TfL responded ${r.status}`);
    const raw = await r.json();

    const trains = raw
      .map((a) => ({
        id: a.id,
        line: a.lineId, // "district" | "circle" | "piccadilly"
        lineName: a.lineName,
        platform: a.platformName || "Platform",
        direction: a.direction || "",
        destination: (a.destinationName || a.towards || "Check front of train")
          .replace(/ Underground Station$/, ""),
        towards: a.towards || "",
        currentLocation: a.currentLocation || "",
        expected: a.expectedArrival,
        seconds: a.timeToStation,
      }))
      .sort((x, y) => x.seconds - y.seconds);

    // Line status for the three lines serving the station
    let status = [];
    try {
      const s = await fetch(`https://api.tfl.gov.uk/Line/district,circle,piccadilly/Status${key}`);
      if (s.ok) {
        status = (await s.json()).map((l) => ({
          line: l.id,
          name: l.name,
          status: l.lineStatuses?.[0]?.statusSeverityDescription || "Unknown",
          severity: l.lineStatuses?.[0]?.statusSeverity ?? 10,
          reason: l.lineStatuses?.[0]?.reason || "",
        }));
      }
    } catch {}

    res.setHeader("Cache-Control", "s-maxage=20, stale-while-revalidate=10");
    res.status(200).json({ station: "South Kensington", updated: new Date().toISOString(), trains, status });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
}
