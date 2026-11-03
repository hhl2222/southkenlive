// Current London weather from Open-Meteo (free, no API key needed)

const URL =
  "https://api.open-meteo.com/v1/forecast?latitude=51.4941&longitude=-0.1738" +
  "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,relative_humidity_2m,is_day" +
  "&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=Europe%2FLondon";

export default async function handler(req, res) {
  try {
    const r = await fetch(URL);
    if (!r.ok) throw new Error(`Open-Meteo responded ${r.status}`);
    const d = await r.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=60");
    res.status(200).json({
      temperature: d.current.temperature_2m,
      feelsLike: d.current.apparent_temperature,
      code: d.current.weather_code,
      wind: d.current.wind_speed_10m,
      humidity: d.current.relative_humidity_2m,
      isDay: d.current.is_day === 1,
      high: d.daily?.temperature_2m_max?.[0],
      low: d.daily?.temperature_2m_min?.[0],
      time: d.current.time,
    });
  } catch (err) {
    res.status(502).json({ error: String(err.message || err) });
  }
}
