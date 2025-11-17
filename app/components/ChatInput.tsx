"use client";

import { useState, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function ChatInput({
  onSend,
  isLoading,
  placeholder = "質問を書いてください…",
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput("");
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
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
          placeholder={placeholder}
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
            fontFamily: "inherit",
          }}
        />

        <button
          onClick={handleSend}
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
            boxShadow:
              isLoading || !input.trim()
                ? "none"
                : "0 4px 12px rgba(102, 126, 234, 0.4)",
            transition: "all 0.3s ease",
          }}
        >
          {isLoading ? "⏳" : "Send"}
        </button>
      </div>

      <style jsx>{`
        .hover-scale {
          transition: transform 0.2s ease;
        }
        .hover-scale:hover:not(:disabled) {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
