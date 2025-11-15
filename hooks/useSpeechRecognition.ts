import { useState, useEffect, useRef } from 'react';

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
// The Web Speech API is not part of the standard DOM typings.
interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly [index: number]: { readonly transcript: string };
}

interface SpeechRecognitionResultList {
  readonly [index: number]: SpeechRecognitionResult;
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: () => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

// Extend the Window interface to include SpeechRecognition APIs.
interface WindowWithSpeech extends Window {
  SpeechRecognition?: SpeechRecognitionStatic;
  webkitSpeechRecognition?: SpeechRecognitionStatic;
}

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  isSupported: boolean;
}

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Fix: The 'SpeechRecognition' type is now defined, resolving the error.
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Fix: Cast window to our extended interface to access SpeechRecognition APIs safely.
    const SpeechRecognition = (window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ja-JP';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError(event.error);
    };
    
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    // Fix: Cast window to our extended interface to access SpeechRecognition APIs safely.
    isSupported: !!((window as WindowWithSpeech).SpeechRecognition || (window as WindowWithSpeech).webkitSpeechRecognition),
  };
};

export default useSpeechRecognition;
