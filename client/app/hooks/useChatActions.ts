import { useChatStore } from '@/app/stores/chatStore';
import { useUIStore } from '@/app/stores/uiStore';
import { Message } from '@/app/types/chat';
import { chatAPI } from '@/app/lib/api';

export const useChatActions = () => {
  const { activeChat, addMessageToChat, updateMessageInChat, retryMessage, renameChat } = useChatStore();
  const { 
    inputMessage, 
    clearInputMessage, 
    setActiveStreamId, 
    setIsStreamActive,
    setIsTyping,
    activeStreamId 
  } = useUIStore();

  const sendMessage = async () => {
    if (!inputMessage.trim() || !activeChat) return;

    // Set stream active immediately to show stop button
    setIsStreamActive(true);
    // Show typing indicator while waiting for response
    setIsTyping(true);
    
    // Declare user message outside try block for error handling
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    try {
      // Add user message
      addMessageToChat(activeChat.id, userMessage);

      // Update chat title if it's a new chat
      if (activeChat.title === 'New Chat' && inputMessage.length > 0) {
        const newTitle = inputMessage.length > 30 ? inputMessage.substring(0, 30) + '...' : inputMessage;
        // Use renameChat to persist the title to database
        renameChat(activeChat.id, newTitle).catch(error => {
          console.error('Failed to update chat title:', error);
        });
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
          // Hide typing indicator on first token
          if (accumulatedContent === '') {
            setIsTyping(false);
          }
          
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
          
          // Clear stream state and typing indicator
          setActiveStreamId(null);
          setIsStreamActive(false);
          setIsTyping(false);
        },
        // On error
        (error: Error) => {
          console.error('Streaming error:', error);
          
          // Mark the user message as failed
          updateMessageInChat(activeChat.id, userMessage.id, {
            error: true
          });
          
          // Remove the bot message placeholder since streaming failed
          // Get current state and filter out the failed bot message
          const currentChats = useChatStore.getState().chats;
          const currentActiveChat = useChatStore.getState().activeChat;
          
          const updatedChats = currentChats.map(chat => 
            chat.id === activeChat.id 
              ? { ...chat, messages: chat.messages.filter(msg => msg.id !== botMessageId) }
              : chat
          );
          
          useChatStore.setState({
            chats: updatedChats,
            activeChat: currentActiveChat?.id === activeChat.id
              ? { ...currentActiveChat, messages: currentActiveChat.messages.filter(msg => msg.id !== botMessageId) }
              : currentActiveChat
          });
          
          // Clear stream state and typing indicator
          setActiveStreamId(null);
          setIsStreamActive(false);
          setIsTyping(false);
        },
        // On stream ID received
        (streamId: string) => {
          console.log('Stream ID received:', streamId);
          setActiveStreamId(streamId);
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mark the user message as failed
      updateMessageInChat(activeChat.id, userMessage.id, {
        error: true
      });
      
      // Don't add error message - let retry button handle it
    } finally {
      setIsStreamActive(false);
      setActiveStreamId(null);
      setIsTyping(false);
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
      setIsTyping(false);
    } catch (error) {
      console.error('Error stopping stream:', error);
      // Still clear the stream state even if the API call fails
      setActiveStreamId(null);
      setIsStreamActive(false);
      setIsTyping(false);
    }
  };

  const handleRetry = async (messageId: string, originalContent: string) => {
    if (!activeChat) return;
    
    await retryMessage(activeChat.id, messageId, originalContent);
  };

  return {
    sendMessage,
    stopStream,
    handleRetry
  };
};
