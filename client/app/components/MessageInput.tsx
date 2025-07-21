'use client';

import { useUIStore } from '@/app/stores/uiStore';
import { useChatActions } from '@/app/hooks/useChatActions';

export default function MessageInput() {
  const { inputMessage, setInputMessage, isStreamActive } = useUIStore();
  const { sendMessage, stopStream } = useChatActions();

  const handleButtonClick = () => {
    if (isStreamActive) {
      console.log('Stop button clicked');
      stopStream();
    } else {
      console.log('Send button clicked');
      sendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleButtonClick();
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
          disabled={isStreamActive}
        />
        <button
          onClick={handleButtonClick}
          disabled={!isStreamActive && !inputMessage.trim()}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            isStreamActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-gray-800 text-white hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
          }`}
        >
          {isStreamActive ? (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <rect x="6" y="4" width="8" height="12" rx="1"/>
              </svg>
              Stop
            </>
          ) : (
            'Send'
          )}
        </button>
      </div>
    </div>
  );
}
