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

  // Theme icons
  const themeIcons: Record<string, string> = {
    general: "🌍",
    travel: "✈️",
    fashion: "👗",
    sports: "⚽",
    music: "🎵",
    agriculture: "🌾",
    outings: "🏞️",
  };

  // Japanese TTS
  function speakJA(text: string) {
    if (typeof window === "undefined") return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }

  // Get Location
  function getLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("Geolocation not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        setLocationName("Current Location");
        alert("Location updated!");
      },
      (err) => alert("Failed to get location: " + err.message)
    );
  }

  // Send Message
  async function sendMessage(input: string): Promise<void> {
    if (!input.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);
    setIsLoading(true);

    try {
      // First attempt without location
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, theme }),
      });

      const data = await res.json();

      // Check if location is needed
      if (data.needsLocation) {
        console.log("Location needed, requesting permission...");

        if (!navigator?.geolocation) {
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text: "位置情報がサポートされていません。都市名を指定してください。",
            },
          ]);
          setIsLoading(false);
          return;
        }

        // Request location
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

          console.log(`Location obtained: ${currentLat}, ${currentLon}`);

          // Update state for future use
          setLat(currentLat);
          setLon(currentLon);

          // Retry with location
          const retryRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: input,
              theme,
              lat: currentLat,
              lon: currentLon,
            }),
          });

          const retryData = await retryRes.json();

          if (retryData.needsLocation) {
            throw new Error("位置情報を処理できませんでした");
          }

          if (retryData.error) {
            throw new Error(retryData.error);
          }

          const botReply: string = retryData.reply ?? "No response";
          setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
        } catch (geoError: any) {
          console.error("Location error:", geoError);
          setMessages((prev) => [
            ...prev,
            {
              role: "bot",
              text: `位置情報の取得に失敗しました: ${
                geoError.message || "不明なエラー"
              }。都市名を指定してください。`,
            },
          ]);
        }
      } else if (data.error) {
        console.error("API returned error:", data.error);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: `エラー: ${data.error}` },
        ]);
      } else {
        const botReply: string = data.reply ?? "No response";
        setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
      }
    } catch (error) {
      console.error("API request failed:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Request failed. Check server terminal." },
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
          <span style={{ fontSize: "36px" }}>🌤️</span>
          Weather Assistant
        </h1>
        <p style={{ margin: "8px 0 0 0", opacity: 0.9, fontSize: "14px" }}>
          📍 {locationName} • {themeIcons[theme]}{" "}
          {theme.charAt(0).toUpperCase() + theme.slice(1)}
        </p>
      </div>

      {/* Controls Bar */}
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
        <VoiceInput onResult={(text) => sendMessage(text)} />

        <button
          onClick={getLocation}
          className="hover-scale"
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border: "none",
            background: "#4A90E2",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          📍 Location
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
          <option value="travel">✈️ Travel</option>
          <option value="fashion">👗 Fashion</option>
          <option value="sports">⚽ Sports</option>
          <option value="music">🎵 Music</option>
          <option value="agriculture">🌾 Agriculture</option>
          <option value="outings">🏞️ Outings</option>
        </select>
      </div>

      {/* Chat Area */}
      <Chat messages={messages} isLoading={isLoading} onSpeak={speakJA} />

      {/* Input Area */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />

      <style jsx>{`
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
