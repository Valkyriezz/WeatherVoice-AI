import React, { useState, useEffect, useCallback } from "react";
import { Message, Weather } from "./types";
import Header from "./components/Header";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import ApiKeyModal from "./components/ApiKeyModal";
import { fetchWeatherByCoords } from "./services/weatherService";
import {
  createChatSession,
  generateInitialMessage,
  generateChatMessage,
} from "./services/geminiService";

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<any>(null);
  const [isKeyNeeded, setIsKeyNeeded] = useState(true);
  const addMessage = (text: string, sender: "user" | "bot") => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleApiKeySubmit = (apiKey: string) => {
    try {
      localStorage.setItem("GEMINI_API_KEY", apiKey);
      // Pass the API key explicitly to createChatSession
      const newChat = createChatSession(apiKey);
      setChat(newChat);
      setIsKeyNeeded(false);
    } catch (err: any) {
      console.error("API Key Error:", err);
      alert(
        `Failed to initialize with the provided API Key. Error: ${err.message}`
      );
    }
  };

  const getInitialData = useCallback(async () => {
    if (!chat) return;

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
          });
        }
      );
      const { latitude, longitude } = position.coords;
      const weatherData = await fetchWeatherByCoords(latitude, longitude);
      setWeather(weatherData);

      const initialBotMessage = await generateInitialMessage(chat, weatherData);
      addMessage(initialBotMessage, "bot");
    } catch (err: any) {
      let errorMessage =
        "Could not fetch location or weather. Please allow location access and refresh, or tell me your city.";
      if (err.code === 1) {
        // PERMISSION_DENIED
        errorMessage =
          "Location access denied. Please tell me your city to get weather-based suggestions.";
      }
      setError(errorMessage);
      addMessage(errorMessage, "bot");
    } finally {
      setIsLoading(false);
    }
  }, [chat]);

  useEffect(() => {
    getInitialData();
  }, [getInitialData]);

  const handleSendMessage = async (userMessageText: string) => {
    if (!chat || !weather) {
      addMessage(
        "Sorry, the chat is not ready yet. Please wait for initialization.",
        "bot"
      );
      return;
    }

    addMessage(userMessageText, "user");
    setIsLoading(true);

    try {
      const botResponseText = await generateChatMessage(
        chat,
        userMessageText,
        weather
      );
      addMessage(botResponseText, "bot");
    } catch (err) {
      console.error("Gemini API error:", err);
      addMessage(
        "Sorry, I'm having trouble connecting. Please try again later.",
        "bot"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col font-sans antialiased relative">
      {isKeyNeeded && <ApiKeyModal onApiKeySubmit={handleApiKeySubmit} />}
      <div
        className={`flex flex-col h-full transition-filter duration-300 ${
          isKeyNeeded ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <Header />
        <MessageList messages={messages} isLoading={isLoading} />
        <ChatInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isKeyNeeded}
        />
      </div>
    </div>
  );
};

export default App;
