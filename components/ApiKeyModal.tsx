import React, { useState } from "react";

interface ApiKeyModalProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySubmit(apiKey.trim());
    } else {
      alert("Please enter your Gemini API Key.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-4 text-center text-gray-800">
          Enter Your Gemini API Key
        </h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          This key is required to connect to the Gemini API for chat features.
          Your key will only be used locally in your browser.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password" // Use type="password" for sensitive info
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
          >
            Submit API Key
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-4 text-center">
          Don't have a key? Get one from{" "}
          <a
            href="https://ai.google.dev/gemini-api/get-started/web"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Google AI Studio
          </a>
          .
        </p>
      </div>
    </div>
  );
};
export default ApiKeyModal;
