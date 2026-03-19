import { useState, useEffect } from 'react';

export function useGameStats(initialWins = 1284) {
  const [wins, setWins] = useState(initialWins);

  useEffect(() => {
    const interval = setInterval(() => {
      setWins(prev => prev + Math.floor(Math.random() * 2));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 回傳 App.jsx 需要用到的變數
  return { wins };
}