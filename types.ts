
export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
}

export interface Weather {
  location: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}
