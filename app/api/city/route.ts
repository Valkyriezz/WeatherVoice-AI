import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const prompt = `
次の文章から日本の都市名が含まれているかを判断してください。
都市名がある場合は、その都市名のみを1つだけ返してください。
都市名がない場合は空文字("")を返してください。

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

    const city = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    return NextResponse.json({ city });
  } catch (err: any) {
    console.error("City Extraction Error:", err);
    return NextResponse.json({ city: "" });
  }
}
