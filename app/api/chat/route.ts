import { NextResponse } from "next/server";
import { getWeather } from "../../../lib/weather";

// -------------------------------
// Get coordinates from city name
// -------------------------------
async function getCoordinates(city: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    city
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

  throw new Error(`City not found: ${city}`);
}

// -------------------------------
// Extract city name via Gemini
// -------------------------------
async function extractCityName(message: string): Promise<string> {
  const prompt = `あなたは都市名抽出の専門家です。

指示: 次のメッセージから都市名を抽出してください。

重要なルール:
1. 都市名が明確に含まれている場合のみ、その都市名だけを返す
2. 都市名が含まれていない場合は "NONE" と返す
3. 他の説明や文章は絶対に含めない
4. 「ここ」「現在地」「私の場所」などの表現は都市名ではないので "NONE" と返す

例:
- "東京の天気は？" → "東京"
- "大阪は暑いですか" → "大阪"
- "temperature of my area" → "NONE"
- "今日の天気" → "NONE"
- "ここの気温は？" → "NONE"

メッセージ: "${message}"

都市名:`;

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

    // Normalize the result
    const normalized = result.toLowerCase();

    // Return empty string if no city found
    if (
      normalized === "none" ||
      normalized === "" ||
      normalized.includes("空文字") ||
      normalized.includes("ありません") ||
      normalized.includes("含まれていない") ||
      normalized.includes("見つかりません") ||
      result.length > 50 // City names shouldn't be this long
    ) {
      return "";
    }

    return result;
  } catch (error) {
    console.error("City extraction failed:", error);
    return "";
  }
}

// -------------------------------
// POST: Main Chat Handler
// -------------------------------
export async function POST(req: Request) {
  try {
    const { message, theme, lat: reqLat, lon: reqLon } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("❌ Missing GEMINI_API_KEY");
    }

    let lat: number | undefined;
    let lon: number | undefined;
    let city: string;

    // Extract city using Gemini
    const extractedCity = await extractCityName(message);
    console.log("Extracted city:", extractedCity || "(none)");

    if (extractedCity) {
      // City name was found in the message
      try {
        const coords = await getCoordinates(extractedCity);
        lat = coords.lat;
        lon = coords.lon;
        city = coords.city;
        console.log(`Using city: ${city} (${lat}, ${lon})`);
      } catch (error) {
        // If geocoding fails, request location
        console.warn(`Failed to geocode city: ${extractedCity}`);

        if (reqLat && reqLon) {
          lat = reqLat;
          lon = reqLon;
          city = "現在地";
          console.log("Falling back to provided coordinates");
        } else {
          return NextResponse.json(
            {
              needsLocation: true,
              message: `「${extractedCity}」が見つかりませんでした。位置情報の使用を許可してください。`,
            },
            { status: 200 }
          );
        }
      }
    } else if (reqLat && reqLon) {
      // Using provided coordinates
      lat = reqLat;
      lon = reqLon;
      city = "現在地";
      console.log(`Using provided location: (${lat}, ${lon})`);
    } else {
      // No city found and no coordinates provided - request location
      console.log("No city found, requesting location");
      return NextResponse.json(
        {
          needsLocation: true,
          message: "位置情報が必要です。現在地の使用を許可してください。",
        },
        { status: 200 }
      );
    }

    // At this point we must have lat and lon
    if (!lat || !lon) {
      throw new Error("位置情報を取得できませんでした");
    }

    // Fetch full weather details
    const weather = await getWeather(lat, lon);

    // ---------------------------------------
    // Build Enhanced Prompt Using Full Weather Details
    // ---------------------------------------
    const tempDiff = Math.abs(weather.temp - weather.feels_like);
    const windCondition =
      weather.wind_speed > 10
        ? "(強風)"
        : weather.wind_speed > 5
        ? "(やや強い)"
        : "(穏やか)";
    const humidityCondition =
      weather.humidity > 70
        ? "(ジメジメ)"
        : weather.humidity < 30
        ? "(乾燥)"
        : "(快適)";
    const visibilityWarning = weather.visibility < 5000 ? "(視界不良)" : "";

    const prompt = `
あなたは「${theme}」をテーマにした、親しみやすい天気アドバイザーです。

📍 場所: ${weather.city}
💬 ユーザーの質問: 「${message}」

【現在の気象データ】
━━━━━━━━━━━━━━━━━━━━
🌡️ 温度情報:
  • 現在気温: ${weather.temp}°C
  • 体感温度: ${weather.feels_like}°C
  • 最低/最高: ${weather.temp_min}°C / ${weather.temp_max}°C
  ${tempDiff > 3 ? "  ⚠️ 体感温度と実際の気温に大きな差があります" : ""}

💨 風と大気:
  • 風速: ${weather.wind_speed} m/s ${windCondition}
  • 風向: ${weather.wind_deg}°
  • 気圧: ${weather.pressure} hPa
  • 湿度: ${weather.humidity}% ${humidityCondition}

☁️ 視界と天候:
  • 天気: ${weather.mainWeather} (${weather.condition})
  • 雲量: ${weather.clouds}%
  • 視界: ${weather.visibility}m ${visibilityWarning}

🌅 日照時間:
  • 日の出: ${weather.sunrise}
  • 日の入り: ${weather.sunset}
━━━━━━━━━━━━━━━━━━━━

【指示】
1. **データ活用**: 上記の気象データ全体を分析し、特に重要な情報(極端な値、警告すべき状態)を優先的に考慮してください
2. **テーマ統合**: 「${theme}」のキャラクター性を自然に活かし、押し付けがましくならないよう配慮してください
3. **実用性重視**: 
   - 体感温度と実気温の差が大きい場合は服装のアドバイス
   - 湿度が極端な場合は健康への配慮
   - 風速が強い場合は外出時の注意
   - 視界不良の場合は安全への警告
4. **簡潔さ**: 2-3文で、自然で親しみやすい日本語で回答してください

回答例の参考(必ずしもこの形式でなくて良い):
「${weather.city}は今${weather.temp}°Cですが、体感は${
      weather.feels_like
    }°Cです。${
      weather.humidity > 70 ? "湿度が高めなので" : ""
    }適切な服装がおすすめです。${
      weather.wind_speed > 7 ? "風が強いので外出時は注意してくださいね。" : ""
    }」
    `;

    // Gemini Response
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
