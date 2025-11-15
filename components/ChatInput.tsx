
import React, { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, SendIcon } from './icons';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [text, setText] = useState('');
  const { isListening, transcript, startListening, stopListening, isSupported, error } = useSpeechRecognition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-2 md:p-4">
        {isSupported && (isListening || transcript) && (
            <div className="px-3 py-1 text-sm text-gray-600 bg-gray-100 rounded-t-lg">
                {isListening ? "Listening..." : "Transcript: " + transcript}
                {error && <span className="text-red-500 ml-2">{error}</span>}
            </div>
        )}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
            }
          }}
          placeholder="メッセージを入力するか、マイクボタンを使用してください..."
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-y-hidden max-h-40"
          rows={1}
          disabled={isLoading}
        />
        {isSupported && (
            <button
              type="button"
              onClick={handleMicClick}
              className={`p-3 rounded-full transition-colors duration-200 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <MicrophoneIcon className="w-6 h-6" />
            </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !text.trim()}
          className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <SendIcon className="w-6 h-6" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;
