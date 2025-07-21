export interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export interface Chat {
  id: string;
  title: string;
  timestamp: string;
  messages: Message[];
}

export interface CreateChatRequest {
  title?: string;
}

export interface CreateChatResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
  };
  message: string;
}
