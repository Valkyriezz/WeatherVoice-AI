"use client";

import { useState, useEffect } from "react";

interface VoiceInputProps {
  onResult: (text: string) => void;
}

export default function VoiceInput({ onResult }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted
    setIsMounted(true);

    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const startListening = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP"; // Japanese language
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      alert(`音声認識エラー: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <button
        disabled
        style={{
          padding: "10px 16px",
          borderRadius: "12px",
          border: "none",
          background: "#ccc",
          color: "white",
          cursor: "not-allowed",
          fontSize: "14px",
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        🎤 Voice
      </button>
    );
  }

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <button
      onClick={startListening}
      disabled={isListening}
      className="hover-scale"
      style={{
        padding: "10px 16px",
        borderRadius: "12px",
        border: "none",
        background: isListening
          ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)"
          : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        cursor: isListening ? "not-allowed" : "pointer",
        fontSize: "14px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        transition: "all 0.3s ease",
      }}
    >
      {isListening ? (
        <>
          <span className="pulse">🎤</span> Listening...
        </>
      ) : (
        <>🎤 Voice</>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        .pulse {
          animation: pulse 1s infinite;
        }
      `}</style>
    </button>
  );
}
