"use client";

import { useState, useEffect, useRef } from "react";

export default function VoiceInput({
  onResult,
}: {
  onResult: (t: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      // @ts-ignore
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const r = new SpeechRecognition();
    r.lang = "ja-JP"; // IMPORTANT: Japanese
    r.interimResults = false;

    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text); // return recognized Japanese speech → text
    };

    r.onend = () => setListening(false);

    recognitionRef.current = r;
  }, [onResult]);

  function toggle() {
    const r = recognitionRef.current;
    if (!r) {
      alert("Browser does not support voice input. Use Chrome.");
      return;
    }
    if (!listening) r.start();
    else r.stop();
    setListening(!listening);
  }

  return (
    <button onClick={toggle}>
      {listening ? "Listening…" : "🎤 Voice Input (JA)"}
    </button>
  );
}
