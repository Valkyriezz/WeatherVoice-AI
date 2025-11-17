import { NextResponse } from "next/server";
import { getWeather } from "../../../lib/weather";

// -----------------------------------------
// Get coordinates from city name
// -----------------------------------------
async function getCoordinates(city: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
  )}&count=1&language=ja&format=json`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.results?.length) {
    const r = data.results[0];
    return {
      lat: r.latitude,
      lon: r.longitude,
      city: r.name,
    };
  }

  throw new Error(`City not found: ${city}`);
}

// -----------------------------------------
// Extract city name (Japanese prompt OK)
// -----------------------------------------
async function extractCityName(message: string): Promise<string> {
  const prompt = `
あなたは都市名抽出の専門家です。

以下のルールに従ってください:
1. メッセージに都市名が含まれている場合のみ、その都市名 **だけ** を返す
2. 含まれていない場合は "NONE" と返す
3. 他の文章は絶対に返さない

メッセージ: "${message}"

都市名:
`;

  try {
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

    const result =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const lower = result.toLowerCase();

    if (
      lower === "none" ||
      lower.includes("ない") ||
      lower.includes("ありません") ||
      result.length > 50
    ) {
      return "";
    }

    return result;
  } catch (e) {
    console.error("City extraction failed:", e);
    return "";
  }
}

// ======================================================
//                MAIN CHAT HANDLER
// ======================================================
export async function POST(req: Request) {
  try {
    // -----------------------------------------
    // Parse & Type Incoming Body
    // -----------------------------------------
    const body = await req.json();

    const lang: "en" | "ja" = body.lang; // ⭐ FULLY TYPED
    const message: string = body.message;
    const theme: string = body.theme;

    const reqLat: number | undefined = body.lat;
    const reqLon: number | undefined = body.lon;

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    // -----------------------------------------
    // Language Packs
    // -----------------------------------------
    const L = {
      en: {
        needLocation: "Location is required. Please enable GPS.",
        notFound: (c: string) =>
          `Could not find “${c}”. Please allow location access.`,
        fallbackCity: "Your Location",
        aiError: "AI returned no response.",
        sysRole: (city: string, theme: string) => `
You are a friendly weather assistant.
Your job is to answer ONLY in **English**.
Theme personality: ${theme}

Location: ${city}
User question: "${message}"

Respond:
• In **2–3 short English sentences**
• Friendly and practical
• Based on FULL weather data provided below
• Include safety warnings if needed
`,
      },

      ja: {
        needLocation: "位置情報が必要です。現在地の使用を許可してください。",
        notFound: (c: string) =>
          `「${c}」が見つかりませんでした。位置情報の使用を許可してください。`,
        fallbackCity: "現在地",
        aiError: "（AIからの応答がありません）",
        sysRole: (city: string, theme: string) => `
あなたは親しみやすい天気アドバイザーです。
返答は必ず **日本語のみ** で書いてください。
テーマの雰囲気: ${theme}

場所: ${city}
ユーザーの質問: 「${message}」

以下の天気データをすべて参考にし、
• 2〜3文で簡潔に
• 親しみやすく自然な口調で
• 警告が必要なら注意を促す

で回答してください。
`,
      },
    };

    const t = L[lang]; // ⭐ NO ERROR NOW

    // -----------------------------------------
    // City / Location Handling
    // -----------------------------------------
    let lat: number | undefined;
    let lon: number | undefined;
    let city: string = t.fallbackCity;

    const extractedCity = await extractCityName(message);
    console.log("Extracted city:", extractedCity);

    if (extractedCity) {
      try {
        const info = await getCoordinates(extractedCity);
        lat = info.lat;
        lon = info.lon;
        city = info.city;
      } catch {
        if (reqLat && reqLon) {
          lat = reqLat;
          lon = reqLon;
          city = t.fallbackCity;
        } else {
          return NextResponse.json({
            needsLocation: true,
            message: t.notFound(extractedCity),
          });
        }
      }
    } else if (reqLat && reqLon) {
      lat = reqLat;
      lon = reqLon;
      city = t.fallbackCity;
    } else {
      return NextResponse.json({
        needsLocation: true,
        message: t.needLocation,
      });
    }

    if (!lat || !lon) {
      throw new Error("Missing coordinates");
    }

    // -----------------------------------------
    // Fetch Weather
    // -----------------------------------------
    const weather = await getWeather(lat, lon);

    const weatherBlock = `
Weather Data:
• Temperature: ${weather.temp}°C
• Feels like: ${weather.feels_like}°C
• Min/Max: ${weather.temp_min}°C / ${weather.temp_max}°C
• Humidity: ${weather.humidity}%
• Wind: ${weather.wind_speed} m/s (${weather.wind_deg}°)
• Condition: ${weather.mainWeather} (${weather.condition})
• Visibility: ${weather.visibility}m
• Clouds: ${weather.clouds}%
• Sunrise: ${weather.sunrise}
• Sunset: ${weather.sunset}
`;

    const finalPrompt = t.sysRole(city, theme) + "\n" + weatherBlock;

    // -----------------------------------------
    // Gemini Request
    // -----------------------------------------
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
        }),
      }
    );

    const raw = await response.text();
    const data = JSON.parse(raw);

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text ?? t.aiError;

    return NextResponse.json({ reply, weather, city });
  } catch (err: any) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Server Error" },
      { status: 500 }
    );
  }
}
