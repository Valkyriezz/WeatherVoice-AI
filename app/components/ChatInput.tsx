"use client";

import { useState } from "react";

export interface ChatInputProps {
  onSend: (input: string) => Promise<void> | void;
  isLoading: boolean;
  placeholder: string;
  sendLabel: string;
}

export default function ChatInput({
  onSend,
  isLoading,
  placeholder,
  sendLabel,
}: ChatInputProps) {
  const [input, setInput] = useState("");

  const send = async () => {
    if (!input.trim() || isLoading) return;
    await onSend(input);
    setInput("");
  };

  return (
    <div className="p-4 bg-white/20 backdrop-blur-xl border-t border-white/30 flex gap-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        onKeyDown={(e) => e.key === "Enter" && send()}
        className="flex-1 px-4 py-2 rounded-xl bg-white/80 border text-black"
      />

      <button
        onClick={send}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded-xl shadow disabled:bg-gray-400"
      >
        {sendLabel}
      </button>
    </div>
  );
}
