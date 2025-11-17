"use client";

import { useEffect, useRef } from "react";

export type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

interface ChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSpeak: (text: string) => void;
  translations: {
    startTitle: string;
    startSub: string;
    speakBtn: string;
  };
}

export default function Chat({
  messages,
  isLoading,
  onSpeak,
  translations,
}: ChatProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "24px",
        background: "#ffffff",
      }}
    >
      {/* Empty State */}
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
            {translations.startTitle}
          </h3>
          <p style={{ margin: 0, fontSize: "14px" }}>{translations.startSub}</p>
        </div>
      )}

      {/* Messages */}
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
              display: "flex",
              flexDirection: "column",
              alignItems: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "70%",
              gap: "8px",
            }}
          >
            {/* Message Bubble */}
            <div
              style={{
                padding: "12px 18px",
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

            {/* Speak Button (Bot only) */}
            {m.role === "bot" && (
              <button
                onClick={() => onSpeak(m.text)}
                className="hover-scale"
                style={{
                  padding: "6px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#667eea",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {translations.speakBtn}
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Loading Indicator */}
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

      {/* Scroll Target */}
      <div ref={messagesEndRef} />

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
