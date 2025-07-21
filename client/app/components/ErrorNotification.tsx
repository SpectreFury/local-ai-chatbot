'use client';

import { useChatStore } from '@/app/stores/chatStore';
import { useEffect, useState } from 'react';

export default function ErrorNotification() {
  const { error, setError } = useChatStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      // Auto-hide error after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setError(null), 300); // Wait for fade out animation
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setError(null), 300);
  };

  if (!error) return null;

  return (
    <div
      className={`fixed top-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg transition-all duration-300 z-50 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-red-800">Connection Issue</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
