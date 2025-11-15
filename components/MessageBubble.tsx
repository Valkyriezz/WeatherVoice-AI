
import React from 'react';
import { Message } from '../types';
import { BotIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-end gap-2 my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <BotIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-3 rounded-2xl ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        <div className={`text-xs mt-1 ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
          {message.timestamp}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
