import { NextResponse } from "next/server";
import { getWeather } from "../../../lib/weather";

export async function POST(req: Request) {
  try {
    const { message, lat, lon, theme } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("❌ Missing GEMINI_API_KEY");
    }

    // ---- Get Real Weather ----
    const weather = await getWeather(lat, lon);

    // ---- Build Prompt ----
    const prompt = `
テーマ: ${theme}
質問: ${message}

現在の${weather.city}の天気: 「${weather.condition}」
気温: ${weather.temp}度

上記の情報を使って、日本語で短い・自然なアドバイスを返してください。
`;

    // ---- Gemini Request ----
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

    if (!response.ok) {
      throw new Error(`Gemini Error: ${raw}`);
    }

    const data = JSON.parse(raw);

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "（AIからの応答がありません）";

    return NextResponse.json({ reply, weather });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
