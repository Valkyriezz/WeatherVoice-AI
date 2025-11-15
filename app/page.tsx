
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Message, Weather } from './types';
import Header from './components/Header';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import { fetchWeatherByCoords } from './services/weatherService';
import { createChatSession, generateInitialMessage, generateChatMessage } from './services/geminiService';

const Page: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);

  const addMessage = (text: string, sender: 'user' | 'bot') => {
    const newMessage: Message = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      sender,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  useEffect(() => {
    try {
      const newChat = createChatSession();
      setChat(newChat);
    } catch (err: any) {
      console.error("Initialization Error:", err);
      const errorMessage = "Failed to initialize chat session. Please ensure the API key is configured correctly in your environment.";
      setError(errorMessage);
      addMessage(errorMessage, 'bot');
      setIsLoading(false);
    }
  }, []);

  const getInitialData = useCallback(async () => {
      if (!chat) return;

      setIsLoading(true);
      setError(null);
      
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        const { latitude, longitude } = position.coords;
        const weatherData = await fetchWeatherByCoords(latitude, longitude);
        setWeather(weatherData);
        
        const initialBotMessage = await generateInitialMessage(chat, weatherData);
        addMessage(initialBotMessage, 'bot');

      } catch (err: any) {
        let errorMessage = 'Could not fetch location or weather. Please allow location access and refresh, or tell me your city.';
        if (err.code === 1) { // PERMISSION_DENIED
            errorMessage = 'Location access denied. Please tell me your city to get weather-based suggestions.';
        }
        setError(errorMessage);
        addMessage(errorMessage, 'bot');
      } finally {
        setIsLoading(false);
      }
  }, [chat]);

  useEffect(() => {
    if (chat) {
      getInitialData();
    }
  }, [chat, getInitialData]);

  const handleSendMessage = async (userMessageText: string) => {
    if (!chat || !weather) {
      addMessage("Sorry, the chat is not ready yet. Please wait for initialization.", 'bot');
      return;
    }
    
    addMessage(userMessageText, 'user');
    setIsLoading(true);

    try {
      const botResponseText = await generateChatMessage(chat, userMessageText, weather);
      addMessage(botResponseText, 'bot');
    } catch (err) {
      console.error("Gemini API error:", err);
      addMessage("Sorry, I'm having trouble connecting. Please try again later.", 'bot');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col font-sans antialiased">
        <Header />
        <MessageList messages={messages} isLoading={isLoading} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default Page;
