"use client";

import { useState } from "react";
import VoiceInput from "./components/VoiceInput";

type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Location
  const [lat, setLat] = useState<number>(35.6895);
  const [lon, setLon] = useState<number>(139.6917);

  const [theme, setTheme] = useState<string>("general");

  // -------------------------
  // Japanese TTS
  // -------------------------
  function speakJA(text: string) {
    if (typeof window === "undefined") return;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";

    window.speechSynthesis.cancel(); // Prevent overlapping voices
    window.speechSynthesis.speak(utter);
  }

  // -------------------------
  // Get location
  // -------------------------
  function getLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      alert("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
        alert("Location updated!");
      },
      (err) => alert("Failed to get location: " + err.message)
    );
  }

  // -------------------------
  // Send message
  // -------------------------
  async function sendMessage() {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: input }]);

    // 1️⃣ Ask Gemini if the message contains a city
    let extractedCity = "";
    try {
      const cityRes = await fetch("/api/extract-city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const cityData = await cityRes.json();
      extractedCity = cityData.city || "";
    } catch {
      extractedCity = "";
    }

    const sendLocation = extractedCity === "";

    // 2️⃣ If no city extracted → use GPS
    if (sendLocation && navigator.geolocation) {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLat(pos.coords.latitude);
            setLon(pos.coords.longitude);
            resolve();
          },
          () => resolve()
        );
      });
    }

    try {
      // 3️⃣ Prepare body based on city detection
      const body = sendLocation
        ? { message: input, lat, lon, theme } // No city → use GPS
        : { message: input, theme }; // City found → backend will use city

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      const data = JSON.parse(raw);

      const botReply = data.reply ?? "No response";

      setMessages((prev) => [...prev, { role: "bot", text: botReply }]);
      speakJA(botReply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Request failed. Check server terminal." },
      ]);
    }

    setInput("");
  }

  // -------------------------
  // UI
  // -------------------------
  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        🌤️ Weather + Gemini Voice Chatbot
      </h1>

      {/* Voice Input */}
      <VoiceInput onResult={(text) => setInput(text)} />

      {/* Get Location */}
      <button
        onClick={getLocation}
        style={{
          marginTop: 10,
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "#4A90E2",
          color: "white",
          cursor: "pointer",
        }}
      >
        📍 Get My Location
      </button>

      {/* Theme Selector */}
      <div style={{ marginTop: 20 }}>
        <label style={{ marginRight: 10, fontWeight: 600 }}>
          Select Theme:
        </label>

        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{
            padding: 10,
            borderRadius: 6,
            border: "1px solid #ccc",
            width: "50%",
          }}
        >
          <option value="general">General</option>
          <option value="travel">Travel</option>
          <option value="fashion">Fashion</option>
          <option value="sports">Sports</option>
          <option value="music">Music</option>
          <option value="agriculture">Agriculture</option>
          <option value="outings">Outings</option>
        </select>
      </div>

      {/* Text Input */}
      <div style={{ marginTop: 15 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="質問を書いてください…"
          style={{
            padding: 10,
            width: "70%",
            borderRadius: 6,
            border: "1px solid #ccc",
            marginRight: 8,
          }}
        />

        <button
          onClick={sendMessage}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            border: "none",
            background: "#28a745",
            color: "white",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>

      {/* Chat Bubbles */}
      <div style={{ marginTop: 30 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              margin: "10px 0",
              maxWidth: "75%",
              borderRadius: 10,
              background: m.role === "user" ? "#DCF8C6" : "#F1F1F1",
              marginLeft: m.role === "user" ? "auto" : "0",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              whiteSpace: "pre-wrap",
            }}
          >
            {m.text}
          </div>
        ))}
      </div>
    </main>
  );
}
