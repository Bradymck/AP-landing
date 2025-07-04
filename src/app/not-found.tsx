'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function NotFound() {
  const [clickCount, setClickCount] = useState(0);
  const [showGame, setShowGame] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Game state
  const gameStateRef = useRef({
    player: { x: 400, y: 560 },
    bullets: [] as Array<{ x: number; y: number; speed: number }>,
    centipede: [] as Array<{ x: number; y: number; direction: number }>,
    mushrooms: [] as Array<{ x: number; y: number; hits: number }>,
    keys: {} as Record<string, boolean>,
    lastShoot: 0
  });

  // Game constants
  const GAME_WIDTH = 800;
  const GAME_HEIGHT = 600;
  const PLAYER_SIZE = 20;
  const BULLET_SIZE = 4;
  const SEGMENT_SIZE = 15;
  const MUSHROOM_SIZE = 12;

  const handleSecretClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 7) {
      setShowGame(true);
      initializeGame();
    }
  };

  const initializeGame = () => {
    const state = gameStateRef.current;
    state.player = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 40 };
    state.bullets = [];
    state.centipede = [];
    state.mushrooms = [];
    setScore(0);
    setGameStarted(false);
    setGameOver(false);

    // Create centipede
    for (let i = 0; i < 10; i++) {
      state.centipede.push({
        x: 50 + i * SEGMENT_SIZE,
        y: 50,
        direction: 1
      });
    }

    // Create random mushrooms
    for (let i = 0; i < 25; i++) {
      state.mushrooms.push({
        x: Math.random() * (GAME_WIDTH - MUSHROOM_SIZE),
        y: Math.random() * (GAME_HEIGHT * 0.7) + 60,
        hits: 0
      });
    }
  };

  const startGame = () => {
    setGameStarted(true);
    gameLoopRef.current = setInterval(updateGame, 16); // ~60fps
  };

  const resetGame = () => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    setGameOver(false);
    initializeGame();
    startGame();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    gameStateRef.current.keys[e.key.toLowerCase()] = true;
    if (e.key === ' ') {
      e.preventDefault();
      shoot();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    gameStateRef.current.keys[e.key.toLowerCase()] = false;
  };

  const shoot = () => {
    const now = Date.now();
    const state = gameStateRef.current;
    if (now - state.lastShoot < 200) return;

    state.bullets.push({
      x: state.player.x,
      y: state.player.y,
      speed: 8
    });
    state.lastShoot = now;
  };

  const updateGame = () => {
    if (!gameStarted || gameOver) return;

    const state = gameStateRef.current;

    // Update player
    if (state.keys['arrowleft'] || state.keys['a']) {
      state.player.x = Math.max(PLAYER_SIZE, state.player.x - 5);
    }
    if (state.keys['arrowright'] || state.keys['d']) {
      state.player.x = Math.min(GAME_WIDTH - PLAYER_SIZE, state.player.x + 5);
    }

    // Update bullets
    state.bullets = state.bullets.filter(bullet => {
      bullet.y -= bullet.speed;
      return bullet.y > 0;
    });

    // Update centipede
    state.centipede.forEach(segment => {
      segment.x += segment.direction * 2;
      
      if (segment.x <= SEGMENT_SIZE || segment.x >= GAME_WIDTH - SEGMENT_SIZE) {
        segment.direction *= -1;
        segment.y += SEGMENT_SIZE;
      }
    });

    // Check collisions
    checkCollisions();

    // Render
    render();

    // Check game over
    if (state.centipede.some(seg => seg.y > GAME_HEIGHT - 80)) {
      endGame();
    }

    // Check win condition
    if (state.centipede.length === 0) {
      // Spawn new centipede
      for (let i = 0; i < Math.min(12, 10 + Math.floor(score / 200)); i++) {
        state.centipede.push({
          x: 50 + i * SEGMENT_SIZE,
          y: 50,
          direction: 1
        });
      }
      setScore(prev => prev + 200);
    }
  };

  const checkCollisions = () => {
    const state = gameStateRef.current;
    
    // Bullet vs Centipede
    state.bullets.forEach((bullet, bIndex) => {
      state.centipede.forEach((segment, sIndex) => {
        const dx = bullet.x - segment.x;
        const dy = bullet.y - segment.y;
        if (Math.sqrt(dx * dx + dy * dy) < SEGMENT_SIZE) {
          state.bullets.splice(bIndex, 1);
          state.centipede.splice(sIndex, 1);
          setScore(prev => prev + 10);
        }
      });
    });

    // Bullet vs Mushroom
    state.bullets.forEach((bullet, bIndex) => {
      state.mushrooms.forEach((mushroom, mIndex) => {
        const dx = bullet.x - mushroom.x;
        const dy = bullet.y - mushroom.y;
        if (Math.sqrt(dx * dx + dy * dy) < MUSHROOM_SIZE) {
          state.bullets.splice(bIndex, 1);
          mushroom.hits++;
          if (mushroom.hits >= 3) {
            state.mushrooms.splice(mIndex, 1);
            setScore(prev => prev + 5);
          }
        }
      });
    });
  };

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const state = gameStateRef.current;

    // Clear screen
    ctx.fillStyle = '#001122';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw player
    ctx.fillStyle = '#00ff88';
    ctx.fillRect(state.player.x - PLAYER_SIZE/2, state.player.y - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE);

    // Draw bullets
    ctx.fillStyle = '#ffff44';
    state.bullets.forEach(bullet => {
      ctx.fillRect(bullet.x - BULLET_SIZE/2, bullet.y - BULLET_SIZE/2, BULLET_SIZE, BULLET_SIZE);
    });

    // Draw centipede
    state.centipede.forEach((segment, i) => {
      ctx.fillStyle = i === 0 ? '#ff4444' : '#ff8844';
      ctx.fillRect(segment.x - SEGMENT_SIZE/2, segment.y - SEGMENT_SIZE/2, SEGMENT_SIZE, SEGMENT_SIZE);
    });

    // Draw mushrooms
    ctx.fillStyle = '#8B4513';
    state.mushrooms.forEach(mushroom => {
      ctx.globalAlpha = 1 - mushroom.hits * 0.3;
      ctx.fillRect(mushroom.x - MUSHROOM_SIZE/2, mushroom.y - MUSHROOM_SIZE/2, MUSHROOM_SIZE, MUSHROOM_SIZE);
    });
    ctx.globalAlpha = 1;
  };

  const endGame = () => {
    setGameOver(true);
    setGameStarted(false);
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
  };

  useEffect(() => {
    if (gameStarted) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keyup', handleKeyUp);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keyup', handleKeyUp);
      };
    }
  }, [gameStarted]);

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  if (showGame) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-800 via-purple-900 to-blue-800 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">🎮 Secret Discovered!</h2>
            <p className="text-cyan-200 mb-4">You found the hidden ACTUAL Megapede game with all features!</p>
            <button 
              className="text-sm text-blue-400 underline hover:text-blue-300 mb-4"
              onClick={() => setShowGame(false)}
            >
              ← Back to 404
            </button>
          </div>
          
          <div className="relative border-2 border-cyan-300 rounded-lg overflow-hidden mx-auto bg-black">
            <canvas 
              ref={canvasRef}
              className="block max-w-full h-auto"
              width={GAME_WIDTH} 
              height={GAME_HEIGHT}
            />
            
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
                <button 
                  className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors"
                  onClick={startGame}
                >
                  Start Game
                </button>
              </div>
            )}
            
            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80">
                <div className="text-xl font-bold text-red-400 mb-2">Game Over!</div>
                <div className="text-cyan-200 mb-4">Final Score: {score}</div>
                <button 
                  className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 transition-colors"
                  onClick={resetGame}
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
          
          <div className="text-center text-xs text-cyan-300 mt-2">
            <p>Controls: A/D or Arrow Keys to move, Spacebar to shoot</p>
            <p>Score: {score}</p>
          </div>
          
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