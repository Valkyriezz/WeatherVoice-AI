"use client";

import { useState } from "react";
import VoiceInput from "./components/VoiceInput";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "bot"; text: string }[]
  >([]);

  // Location state
  const [lat, setLat] = useState(35.6895); // Tokyo default
  const [lon, setLon] = useState(139.6917);
  const [theme, setTheme] = useState("general");

  // -------------------------
  // Japanese Text-To-Speech
  // -------------------------
  function speakJA(text: string) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ja-JP";
    speechSynthesis.speak(utter);
  }

  // -------------------------
  // Get user location
  // -------------------------
  function getLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLon(pos.coords.longitude);
      },
      () => alert("Failed to get location")
    );
  }

  // -------------------------
  // Send message to AI + Weather API
  // -------------------------
  async function sendMessage() {
    if (!input.trim()) return;

    // Add user bubble immediately
    setMessages((prev) => [...prev, { role: "user", text: input }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, lat, lon, theme }),
      });

      console.log("API STATUS:", res.status, res.statusText);
      const raw = await res.text();
      console.log("API RAW BODY:", raw);

      // If response is NOT JSON, show error
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "❌ API returned invalid JSON. Check server logs.",
          },
        ]);
        return;
      }

      // Add bot reply
      setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);

      speakJA(data.reply);
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "❌ Request failed. Check server terminal." },
      ]);
    }

    setInput("");
  }

  return (
    <main style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1>🌤️ Weather + Gemini Voice Chatbot</h1>

      {/* Voice Input Component */}
      <VoiceInput onResult={(text) => setInput(text)} />

      {/* Get Location Button */}
      <button onClick={getLocation} style={{ marginTop: 10 }}>
        📍 Get My Location
      </button>
      <div style={{ marginTop: 20 }}>
        <label style={{ marginRight: 10 }}>Select Theme:</label>

        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          style={{ padding: 8 }}
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
            width: "75%",
            marginRight: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
          }}
        />

        <button onClick={sendMessage}>Send</button>
      </div>

      {/* Chat Bubbles */}
      <div style={{ marginTop: 30 }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              margin: "8px 0",
              maxWidth: "75%",
              borderRadius: 10,
              background: m.role === "user" ? "#DCF8C6" : "#E8E8E8",
              marginLeft: m.role === "user" ? "auto" : "0",
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
