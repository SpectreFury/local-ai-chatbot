'use client';

export default function TypingIndicator() {
  return (
    <div className="space-y-2">
      <div className="font-semibold text-gray-900">Bot:</div>
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="flex space-x-1 bg-gray-100 rounded-lg px-3 py-2">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
