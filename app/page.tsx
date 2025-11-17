"use client";

import { useState } from "react";
import VoiceInput from "./components/VoiceInput";
import Chat, { ChatMessage } from "./components/Chat";
import ChatInput from "./components/ChatInput";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Location
  const [lat, setLat] = useState<number>(35.6895);
  const [lon, setLon] = useState<number>(139.6917);
  const [locationName, setLocationName] = useState<string>("Tokyo");

  // Theme
  const [theme, setTheme] = useState<string>("general");

  // Language
  const [lang, setLang] = useState<"en" | "ja">("en");

  const themeIcons: Record<string, string> = {
    general: "🌍",
    travel: "✈",
    fashion: "👗",
    sports: "⚽",
    music: "🎵",
    agriculture: "🌾",
    outings: "🏞",
  };

  const translations = {
    en: {
      appTitle: "Weather Assistant",
      locationUpdated: "Location updated!",
      geoNotSupported: "Geolocation not supported.",
      geoFailedPrefix: "Failed to get location: ",
      locationBtn: "📍 Location",
      startTitle: "Start a conversation",
      startSub: "Ask me about weather in any city or use your current location",
      speakBtn: "🔊 Speak",
      inputPlaceholder: "Type your question…",
      sendLabel: "Send",
      locationPromptBot:
        "Geolocation not supported. Please provide a city name.",
      locationErrorBotPrefix: "Failed to get location: ",
      langLabel: "EN",
    },
    ja: {
      appTitle: "天気アシスタント",
      locationUpdated: "位置情報を更新しました！",
      geoNotSupported: "位置情報がサポートされていません。",
      geoFailedPrefix: "位置情報の取得に失敗しました: ",
      locationBtn: "📍 位置情報",
      startTitle: "会話を始めましょう",
      startSub: "都市の天気について聞くか現在地を使用してください",
      speakBtn: "🔊 再生",
      inputPlaceholder: "質問を書いてください…",
      sendLabel: "送信",
      locationPromptBot:
        "位置情報がサポートされていません。都市名を指定してください。",
      locationErrorBotPrefix: "位置情報の取得に失敗しました: ",
      langLabel: "日本語",
    },
  };

  // TTS
  function speak(text: string) {
    if (typeof window === "undefined" || !text) return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang === "ja" ? "ja-JP" : "en-US";

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  // Location button
  function getLocation() {
    if (!navigator?.geolocation) {
      alert(translations[lang].geoNotSupported);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setLocationName(lang === "ja" ? "現在地" : "Current Location");
        alert(translations[lang].locationUpdated);
      },
      (err) => alert(translations[lang].geoFailedPrefix + err.message)
    );
  }

  // Send user message
  async function sendMessage(input: string): Promise<void> {
    if (!input.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setIsLoading(true);

    try {
      // First API request without location
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, theme, lang }),
      });

      const data = await res.json();

      // If backend needs location
      if (data.needsLocation) {
        if (!navigator?.geolocation) {
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: translations[lang].locationPromptBot },
          ]);
          setIsLoading(false);
          return;
        }

        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: true,
              });
            }
          );

          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;

          setLat(currentLat);
          setLon(currentLon);

          // Retry with location
          const retryRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: input,
              theme,
              lang,
              lat: currentLat,
              lon: currentLon,
            }),
          });

          const retryData = await retryRes.json();

          if (retryData.error) {
            throw new Error(retryData.error);
          }

          setMessages((prev) => [
            ...prev,
            { role: "bot", text: retryData.reply ?? "No response" },
          ]);
        } catch (geoError: any) {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text:
                translations[lang].locationErrorBotPrefix +
                (geoError.message || "Unknown error") +
                (lang === "ja"
                  ? "。都市名を指定してください。"
                  : ". Please provide a city name."),
            },
          ]);
        }
      } else {
        // Normal response
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: data.reply ?? "No response" },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text:
            lang === "ja"
              ? "❌ リクエストに失敗しました。サーバーを確認してください。"
              : "❌ Request failed. Check server terminal.",
        },
      ]);
    }

    setIsLoading(false);
  }

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "24px", color: "white" }}>
        <h1
          style={{
            margin: 0,
            fontSize: "28px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span style={{ fontSize: "36px" }}>🌤</span>
          {translations[lang].appTitle}
        </h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
          📍 {locationName} • {themeIcons[theme]}{" "}
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </p>
      </div>

      {/* Controls */}
      <div
        style={{
          padding: "16px 24px",
          background: "#f8f9fa",
          borderBottom: "1px solid #e9ecef",
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <VoiceInput onResult={(text) => sendMessage(text)} lang={lang} />

        <button
          onClick={getLocation}
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border: "none",
            background: "#4A90E2",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {translations[lang].locationBtn}
        </button>

        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border: "2px solid #e9ecef",
            background: "white",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            minWidth: "150px",
          }}
        >
          <option value="general">🌍 General</option>
          <option value="travel">✈ Travel</option>
          <option value="fashion">👗 Fashion</option>
          <option value="sports">⚽ Sports</option>
          <option value="music">🎵 Music</option>
          <option value="agriculture">🌾 Agriculture</option>
          <option value="outings">🏞 Outings</option>
        </select>

        <div style={{ marginLeft: "auto" }}>
          <button
            onClick={() => setLang((l) => (l === "en" ? "ja" : "en"))}
            style={{
              padding: "8px 12px",
              borderRadius: "10px",
              border: "none",
              background: "#222",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {lang === "en" ? "EN" : "日本語"}
          </button>
        </div>
      </div>

      {/* Chat */}
      <Chat
        messages={messages}
        isLoading={isLoading}
        onSpeak={speak}
        translations={translations[lang]}
      />

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        placeholder={translations[lang].inputPlaceholder}
        sendLabel={translations[lang].sendLabel}
      />
    </div>
  );
}
