'use client';

import { useEffect, useRef } from 'react';
import { useChatStore } from '@/app/stores/chatStore';
import { useUIStore } from '@/app/stores/uiStore';
import { useChatActions } from '@/app/hooks/useChatActions';
import TypingIndicator from './TypingIndicator';

export default function ChatArea() {
  const { activeChat } = useChatStore();
  const { isTyping } = useUIStore();
  const { handleRetry } = useChatActions();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change or typing indicator appears
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isTyping]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <>
      {/* Chat Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">{activeChat.title}</h2>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeChat.messages.map((message) => (
          <div key={message.id} className="space-y-2">
            <div className="font-semibold text-gray-900">
              {message.role === 'user' ? 'User:' : 'Bot:'}
            </div>
            <div className="text-gray-800 leading-relaxed">
              {message.content}
            </div>
            
            {/* Show retry button for failed user messages */}
            {message.role === 'user' && message.error && (
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-red-500 text-sm">Message failed to send</span>
                <button
                  onClick={() => handleRetry(message.id, message.content)}
                  disabled={message.isRetrying}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  {message.isRetrying ? (
                    <>
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Retry</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
        
        {/* Show typing indicator when AI is generating response */}
        {isTyping && <TypingIndicator />}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </>
  );
}
