import { useChatStore } from '@/app/stores/chatStore';
import { useUIStore } from '@/app/stores/uiStore';
import { Message } from '@/app/types/chat';
import { chatAPI } from '@/app/lib/api';

export const useChatActions = () => {
  const { activeChat, addMessageToChat, updateChat, updateMessageInChat } = useChatStore();
  const { 
    inputMessage, 
    clearInputMessage, 
    setActiveStreamId, 
    setIsStreamActive,
    activeStreamId 
  } = useUIStore();

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;

    // Set stream active immediately to show stop button
    setIsStreamActive(true);
    
    try {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: inputMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      addMessageToChat(activeChat.id, userMessage);

      // Update chat title if it's a new chat
      if (activeChat.title === 'New Chat' && inputMessage.length > 0) {
        const newTitle = inputMessage.length > 30 ? inputMessage.substring(0, 30) + '...' : inputMessage;
        updateChat(activeChat.id, { title: newTitle });
      }

      const messageContent = inputMessage;
      clearInputMessage();

      // Create bot message placeholder for streaming
      const botMessageId = (Date.now() + 1).toString();
      const botMessage: Message = {
        id: botMessageId,
        role: 'bot',
        content: '',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      addMessageToChat(activeChat.id, botMessage);
      
      // Keep track of the accumulated content for smooth updates
      let accumulatedContent = '';

      // Stream the response with character-by-character updates
      await chatAPI.streamMessage(
        activeChat.id,
        messageContent,
        // On each character/token received
        (token: string) => {
          accumulatedContent += token;
          
          // Update the bot message with accumulated content
          updateMessageInChat(activeChat.id, botMessageId, {
            content: accumulatedContent
          });
        },
                // On streaming complete
        (fullResponse: string) => {
          console.log('Streaming complete. Full response length:', fullResponse.length);
          
          // Ensure final content is set (in case of any discrepancy)
          updateMessageInChat(activeChat.id, botMessageId, {
            content: fullResponse
          });
          
          // Clear stream state
          setActiveStreamId(null);
          setIsStreamActive(false);
        },
        // On error
        (error: Error) => {
          console.error('Streaming error:', error);
          
          const errorMessage = error.message.includes('fetch') 
            ? 'Connection error: Please make sure the server is running.'
            : 'AI Error: Please make sure Ollama is running with the gemma3:1b model.';
            
          // Update bot message with error
          updateMessageInChat(activeChat.id, botMessageId, {
            content: errorMessage
          });
          
          // Clear stream state
          setActiveStreamId(null);
          setIsStreamActive(false);
        },
        // On stream ID received
        (streamId: string) => {
          console.log('Stream ID received:', streamId);
          setActiveStreamId(streamId);
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'bot',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      addMessageToChat(activeChat.id, errorMessage);
    } finally {
      setIsStreamActive(false);
      setActiveStreamId(null);
    }
  };

  const stopStream = async () => {
    if (!activeChat) return;

    try {
      console.log('Stopping stream for chat:', activeChat.id, 'streamId:', activeStreamId);
      await chatAPI.stopStream(activeChat.id, activeStreamId || undefined);
      console.log('Stream stopped successfully');
      
      // Clear stream state immediately
      setActiveStreamId(null);
      setIsStreamActive(false);
    } catch (error) {
      console.error('Error stopping stream:', error);
      // Still clear the stream state even if the API call fails
      setActiveStreamId(null);
      setIsStreamActive(false);
    }
  };

  return {
    sendMessage,
    stopStream
  };
};
