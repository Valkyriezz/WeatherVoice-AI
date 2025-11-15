import { GoogleGenerativeAI } from "@google/generative-ai";
import { Weather } from "../types";

const systemPrompt = `
あなたは天気に関する知識が豊富な、フレンドリーなアシスタントチャットボットです。
ユーザーのメッセージと現在の天気情報に基づいて、その天気に合った活動を提案したり、
質問に答えたりします。回答は常に日本語で行ってください。
簡潔で親しみやすいトーンを心がけてください。
`;

export const createChatSession = () => {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    localStorage.getItem("GEMINI_API_KEY");

  if (!apiKey) {
    throw new Error(
      "Missing VITE_GEMINI_API_KEY in .env.local or API key not provided"
    );
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });

  return model.startChat();
};

export const generateInitialMessage = async (
  chat: any,
  weather: Weather
): Promise<string> => {
  const prompt = `こんにちは！今日の${weather.location}の天気は${weather.description}、気温は${weather.temperature}度です。この天気にぴったりの活動をいくつか提案してください。`;

  const result = await chat.sendMessage(prompt);
  const text = result.response.text();

  if (!text) throw new Error("Failed to generate response from Gemini API");
  return text;
};

export const generateChatMessage = async (
  chat: any,
  userMessage: string,
  weather: Weather
): Promise<string> => {
  const context = `
現在の天気データ:
- 場所: ${weather.location}
- 気温: ${weather.temperature}°C
- 天気: ${weather.description}
- 湿度: ${weather.humidity}%
- 風速: ${weather.windSpeed} m/s
`;

  const prompt = `${context}\nユーザーのメッセージ: ${userMessage}`;
  const result = await chat.sendMessage(prompt);
  const text = result.response.text();

  if (!text) throw new Error("Failed to generate response from Gemini API");
  return text;
};
