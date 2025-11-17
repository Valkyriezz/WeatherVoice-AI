"use client";

import React, { useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

type Lang = "ja-JP" | "en-US";

export default function VoiceInput({
  onResult,
}: {
  onResult: (text: string) => void;
}) {
  const [language, setLanguage] = useState<Lang>("ja-JP");

  const {
    transcript,
    interimTranscript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition({
    clearTranscriptOnListen: false,
  });

  if (!browserSupportsSpeechRecognition) {
    return (
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "12px",
          background: "#fee",
          color: "#c33",
          fontSize: "14px",
          border: "1px solid #fcc",
        }}
      >
        ⚠️ 音声認識が利用できません。Chrome / Edge / Safari を使用してください
      </div>
    );
  }

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({
      continuous: true,
      interimResults: true,
      language,
    });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
    onResult(transcript.trim()); // send final text
  };

  const toggleListening = () => {
    if (listening) stopListening();
    else startListening();
  };

  const switchLang = () => {
    if (listening) stopListening();
    setLanguage((prev) => (prev === "ja-JP" ? "en-US" : "ja-JP"));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <div
        style={{
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Start / Stop Button */}
        <button
          onClick={toggleListening}
          className="hover-scale"
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border: "none",
            background: listening
              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
              : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            color: "white",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {listening ? (
            <>
              <span className="pulse">🔴</span> 聴取中...
            </>
          ) : (
            <>🎤 音声入力</>
          )}
        </button>

        {/* Language Toggle */}
        <button
          onClick={switchLang}
          disabled={listening}
          className="hover-scale"
          style={{
            padding: "10px 16px",
            borderRadius: "12px",
            border: "2px solid #e9ecef",
            background: listening ? "#e9ecef" : "white",
            color: listening ? "#adb5bd" : "#495057",
            cursor: listening ? "not-allowed" : "pointer",
            fontSize: "14px",
            fontWeight: 600,
          }}
        >
          {language === "ja-JP" ? "🇯🇵 日本語" : "🇺🇸 English"}
        </button>
      </div>

      {/* Interim live text */}
      {interimTranscript && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#f0f9ff",
            border: "1px dashed #0ea5e9",
            color: "#0369a1",
            fontSize: "13px",
            fontStyle: "italic",
          }}
        >
          {interimTranscript}
        </div>
      )}

      {/* Final transcript */}
      {transcript && !listening && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "#f8f9fa",
            border: "1px solid #ddd",
            color: "#333",
            fontSize: "13px",
          }}
        >
          {transcript}
        </div>
      )}

      <style jsx>{`
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover:not(:disabled) {
          transform: scale(1.05);
        }
        .pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
