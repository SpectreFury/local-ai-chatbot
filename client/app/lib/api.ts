import { apiFetch, API_ENDPOINTS, buildApiUrl } from './config';

export const chatAPI = {
  async createChat(title: string = 'New Chat') {
    try {
      const response = await apiFetch(API_ENDPOINTS.CHAT, {
        method: 'POST',
        body: JSON.stringify({ title }),
      });

      return response;
    } catch (error) {
      console.error('API Error - createChat:', error);
      throw error;
    }
  },

  async getChats() {
    try {
      const response = await apiFetch(API_ENDPOINTS.CHATS);
      return response;
    } catch (error) {
      console.error('API Error - getChats:', error);
      throw error;
    }
  },

  async getChat(chatId: string) {
    try {
      const response = await apiFetch(API_ENDPOINTS.CHAT_BY_ID(chatId));
      return response;
    } catch (error) {
      console.error('API Error - getChat:', error);
      throw error;
    }
  },

  async createMessage(chatId: string, content: string, role: 'user' | 'bot') {
    try {
      const response = await apiFetch(API_ENDPOINTS.MESSAGE(chatId), {
        method: 'POST',
        body: JSON.stringify({ content, role }),
      });

      return response;
    } catch (error) {
      console.error('API Error - createMessage:', error);
      throw error;
    }
  },

  // Enhanced streaming with async/await and proper error handling
  async streamMessage(
    chatId: string, 
    content: string, 
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void,
    onStreamId?: (streamId: string) => void // Callback to receive stream ID
  ) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MESSAGE(chatId)), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/plain',
        },
        body: JSON.stringify({ content, role: 'user' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      // Get stream ID from response headers for stop functionality
      const streamId = response.headers.get('X-Stream-Id');
      if (streamId && onStreamId) {
        onStreamId(streamId);
      }

      // Use modern ReadableStream API with async iteration
      await this.processStreamWithAsyncIteration(response.body, onChunk, onComplete, onError);

    } catch (error) {
      console.error('API Error - streamMessage:', error);
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    }
  },

  // Helper method to process stream using async iteration
  async processStreamWithAsyncIteration(
    body: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ) {
    const reader = body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullResponse = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete(fullResponse);
          break;
        }

        // Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        
        if (chunk) {
          fullResponse += chunk;
          
          // Process chunk character by character for smoother streaming
          for (const char of chunk) {
            onChunk(char);
            
            // Add small delay between characters for typewriter effect (optional)
            // await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Stream processing error'));
    } finally {
      reader.releaseLock();
    }
  },

  // Alternative streaming method using TransformStream (more advanced)
  async streamMessageWithTransform(
    chatId: string,
    content: string,
    onToken: (token: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ) {
    try {
      const response = await fetch(buildApiUrl(API_ENDPOINTS.MESSAGE(chatId)), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, role: 'user' }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is not readable');
      }

      let fullResponse = '';

      // Create a transform stream to process tokens
      const transformStream = new TransformStream({
        transform(chunk: Uint8Array, controller) {
          const decoder = new TextDecoder();
          const text = decoder.decode(chunk, { stream: true });
          
          // Split by tokens (you can customize this logic)
          const tokens = text.split('');
          
          for (const token of tokens) {
            if (token) {
              fullResponse += token;
              onToken(token);
              controller.enqueue(new TextEncoder().encode(token));
            }
          }
        },
        
        flush(controller) {
          onComplete(fullResponse);
        }
      });

      // Pipe through the transform stream
      const transformedStream = response.body.pipeThrough(transformStream);
      
      // Consume the transformed stream
      const reader = transformedStream.getReader();
      
      try {
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('API Error - streamMessageWithTransform:', error);
      onError(error instanceof Error ? error : new Error('Transform streaming error'));
    }
  },

  async stopStream(chatId: string, streamId?: string) {
    try {
      const response = await apiFetch(API_ENDPOINTS.STOP_CHAT(chatId), {
        method: 'POST',
        body: JSON.stringify({ streamId }),
      });

      return response;
    } catch (error) {
      console.error('API Error - stopStream:', error);
      throw error;
    }
  }
};
