'use client';

import { useUIStore } from '@/app/stores/uiStore';
import { useChatActions } from '@/app/hooks/useChatActions';

export default function MessageInput() {
  const { inputMessage, setInputMessage, isSendingMessage } = useUIStore();
  const { sendMessage } = useChatActions();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="border-t border-gray-200 p-6">
      <div className="flex gap-3 items-end">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          rows={1}
          disabled={isSendingMessage}
        />
        <button
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isSendingMessage}
          className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {isSendingMessage ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Sending...
            </>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
}
