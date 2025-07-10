'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import the MolochGame component to avoid SSR issues
const MolochGame = dynamic(() => import('./components/megapede-game'), {
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
      <div className="fixed inset-0 bg-black overflow-hidden">
        {/* Fullscreen game with safe area support for mobile */}
        <div className="w-full h-full safe-area-inset">
          <MolochGame />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-800 via-purple-900 to-blue-800 text-white flex items-center justify-center p-4 sm:p-6 overflow-auto">
      <div className="max-w-md w-full bg-blue-800 bg-opacity-60 p-6 sm:p-8 rounded-xl backdrop-blur-lg shadow-2xl border border-blue-400 border-opacity-50 relative z-10 text-center my-8">
        <div 
          className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 bg-red-600 text-white text-lg sm:text-xl font-bold rounded-full w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border-2 border-white transform rotate-12 cursor-pointer hover:scale-110 transition-transform select-none"
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
        
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 sm:mb-6 text-white">404</h1>
        
        <p className="text-lg sm:text-xl mb-3 sm:mb-4 font-medium text-blue-100">
          Oops! This platypus has wandered too far from home
        </p>
        
        <p className="text-sm sm:text-base text-blue-200 mb-4 sm:mb-6 leading-relaxed">
          Even our most experienced AquaPrime navigator can't find this page in the vast digital ocean. 
          Our little platypus friend here seems just as confused as you are!
        </p>
        
        <p className="text-cyan-300 text-xs sm:text-sm mb-6 sm:mb-8 italic px-4">
          "I was just looking for some digital kelp and got completely turned around..." - Lost Platypus
        </p>

        {clickCount > 0 && clickCount < 7 && (
          <div className="text-cyan-300 text-sm mb-4 animate-pulse">
            🤔 <span>{7 - clickCount}</span> more clicks...
          </div>
        )}
        
        <Link 
          href="/"
          className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 font-bold bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors text-sm sm:text-base"
        >
          Return to Home Waters
        </Link>
      </div>
    </div>
  );
}