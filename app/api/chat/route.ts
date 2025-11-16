import { NextResponse } from "next/server";
import { getWeather } from "../../../lib/weather";

async function getCoordinates(city: string) {
  const tries = [city]; // First try the city returned by Gemini

  for (const name of tries) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      name
    )}&count=1&language=ja&format=json`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.results?.length) {
      const result = data.results[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
        city: result.name,
      };
    }
  }

  throw new Error(`City not found: ${city}`);
}

async function extractCityName(message: string): Promise<string> {
  const prompt = `
次の文章から都市名だけを抽出してください。
他の言葉を含めず、都市名だけを返してください。

文章: "${message}"
    `;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const raw = await response.text();
  const data = JSON.parse(raw);

  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
}

export async function POST(req: Request) {
  try {
    const { message, theme, lat: reqLat, lon: reqLon } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("❌ Missing GEMINI_API_KEY");
    }

    let lat: number;
    let lon: number;
    let city: string;

    // ---- Extract city ----
    const extractedCity = await extractCityName(message);

    if (extractedCity) {
      // Use city → coordinates
      const coords = await getCoordinates(extractedCity);
      lat = coords.lat;
      lon = coords.lon;
      city = coords.city;
    } else if (reqLat && reqLon) {
      // Fallback to GPS from request
      lat = reqLat;
      lon = reqLon;
      city = "現在地";
    } else {
      throw new Error("都市名を特定できませんでした。");
    }

    // ---- Fetch weather ----
    const weather = await getWeather(lat, lon);

    // ---- Build prompt ----
    const prompt = `
テーマ: ${theme}
質問: ${message}

現在の${weather.city}の天気: 「${weather.condition}」
気温: ${weather.temp}度

上記の情報を使って、日本語で短い・自然なアドバイスを返してください。
`;

    // ---- Gemini response ----
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    const raw = await response.text();
    const data = JSON.parse(raw);

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "（AIからの応答がありません）";

    return NextResponse.json({ reply, weather, city });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
