
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import MessageBubble from './MessageBubble';
// Fix: Import the BotIcon component to resolve the "Cannot find name 'BotIcon'" error.
import { BotIcon } from './icons';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      {isLoading && (
        <div className="flex items-end gap-2 my-2 justify-start">
            <div className="flex-shrink-0">
              <BotIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div className="max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-500 animate-pulse [animation-delay:0.4s]"></div>
                </div>
            </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
