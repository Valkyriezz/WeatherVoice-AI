"use client";

import { useState, useEffect, useRef } from "react";
import VoiceInput from "./components/VoiceInput";

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Location
  const [lat, setLat] = useState<number>(35.6895);
  const [lon, setLon] = useState<number>(139.6917);
  const [locationName, setLocationName] = useState<string>("Tokyo");

  const [theme, setTheme] = useState<string>("general");

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
  async function sendMessage(): Promise<void> {
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
          setInput("");
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
            // Still needs location? Something went wrong
            throw new Error("位置情報を処理できませんでした");
          }

          if (retryData.error) {
            throw new Error(retryData.error);
          }

          const botReply: string = retryData.reply ?? "No response";
          setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
          speakJA(botReply);
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
        speakJA(botReply);
      }
    } catch (error) {
      console.error("API request failed:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Request failed. Check server terminal." },
      ]);
    }

    setIsLoading(false);
    setInput("");
  }
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
      <div
        style={{
          padding: "24px",
          color: "white",
        }}
      >
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
        <VoiceInput onResult={(text) => setInput(text)} />

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

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "#ffffff",
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "#6c757d",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>💬</div>
            <h3 style={{ margin: "0 0 8px 0", color: "#495057" }}>
              Start a conversation
            </h3>
            <p style={{ margin: 0, fontSize: "14px" }}>
              Ask me about weather in any city or use your current location
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "12px 18px",
                maxWidth: "70%",
                borderRadius:
                  m.role === "user"
                    ? "18px 18px 4px 18px"
                    : "18px 18px 18px 4px",
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    : "#f8f9fa",
                color: m.role === "user" ? "white" : "#212529",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "15px",
                lineHeight: "1.5",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {isLoading && (
          <div style={{ display: "flex", marginBottom: "16px" }}>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "18px 18px 18px 4px",
                background: "#f8f9fa",
                display: "flex",
                gap: "6px",
              }}
            >
              <div className="dot" />
              <div className="dot" />
              <div className="dot" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: "20px 24px",
          background: "#f8f9fa",
          borderTop: "1px solid #e9ecef",
        }}
      >
        <div style={{ display: "flex", gap: "12px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="質問を書いてください…"
            rows={1}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: "16px",
              border: "2px solid #e9ecef",
              fontSize: "15px",
              resize: "none",
              outline: "none",
              maxHeight: "120px",
            }}
          />

          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="hover-scale"
            style={{
              padding: "14px 24px",
              borderRadius: "16px",
              border: "none",
              background:
                isLoading || !input.trim()
                  ? "#ccc"
                  : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
              fontSize: "15px",
              fontWeight: 700,
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            }}
          >
            {isLoading ? "⏳" : "Send"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover {
          transform: scale(1.05);
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #667eea;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(2) {
          animation-delay: 0.16s;
        }
        .dot:nth-child(3) {
          animation-delay: 0.32s;
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
