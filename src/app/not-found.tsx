'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the MegapedeGame component to avoid SSR issues
const MegapedeGame = dynamic(() => import('./components/megapede/components/megapede-game'), {
  ssr: false,
  loading: () => <div className="text-cyan-300">Loading game...</div>
});

export default function NotFound() {
  const [clickCount, setClickCount] = useState(0);
  const [showGame, setShowGame] = useState(false);

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 7) {
      setShowGame(true);
      setClickCount(0);
    }
  };

  if (showGame) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 via-purple-900 to-blue-800 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">🎮 Secret Discovered!</h2>
            <p className="text-cyan-200 mb-4">You found the hidden ACTUAL AquaPrime Megapede game!</p>
            <button 
              className="text-sm text-blue-400 underline hover:text-blue-300 mb-4"
              onClick={() => setShowGame(false)}
            >
              ← Back to 404
            </button>
          </div>
          
          <MegapedeGame />
          
          <div className="text-center mt-4">
            <Link 
              href="/"
              className="inline-flex items-center justify-center px-8 py-4 font-bold bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
            >
              Return to Home Waters
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 via-purple-900 to-blue-800 text-white flex items-center justify-center p-4 overflow-hidden">
      <div className="max-w-md bg-blue-800 bg-opacity-60 p-8 rounded-xl backdrop-blur-lg shadow-2xl border border-blue-400 border-opacity-50 relative z-10 text-center">
        <div 
          className="absolute -top-6 -right-6 bg-red-600 text-white text-xl font-bold rounded-full w-14 h-14 flex items-center justify-center border-2 border-white transform rotate-12 cursor-pointer hover:scale-110 transition-transform select-none"
          onClick={handleSecretClick}
          title="Something's hidden here... 🤔"
        >
          404
        </div>
        
        <img 
          src="/lost.gif" 
          alt="Lost ARI Platypus" 
          className="w-24 h-24 rounded-lg mx-auto mb-6"
        />
        
        <h1 className="text-4xl font-extrabold mb-6 text-white">404</h1>
        
        <p className="text-xl mb-4 font-medium text-blue-100">
          Oops! This platypus has wandered too far from home
        </p>
        
        <p className="text-blue-200 mb-6 leading-relaxed">
          Even our most experienced AquaPrime navigator can't find this page in the vast digital ocean. 
          Our little platypus friend here seems just as confused as you are!
        </p>
        
        <p className="text-cyan-300 text-sm mb-8 italic">
          "I was just looking for some digital kelp and got completely turned around..." - Lost Platypus
        </p>

        {clickCount > 0 && clickCount < 7 && (
          <div className="text-cyan-300 text-sm mb-4 animate-pulse">
            🤔 <span>{7 - clickCount}</span> more clicks...
          </div>
        )}
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-8 py-4 font-bold bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
        >
          Return to Home Waters
        </Link>
      </div>
    </div>
  );
}