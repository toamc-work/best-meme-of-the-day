import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Trophy, Clock, Play, Layers } from 'lucide-react';
import type { DailyWinnerResponse } from '../shared/api';

function useCountdown(endAt: number | null): string {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endAt) return;
    const id = setInterval(() => setRemaining(Math.max(0, endAt - Date.now())), 1000);
    return () => clearInterval(id);
  }, [endAt]);
  const h = Math.floor(remaining / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  const s = Math.floor((remaining % 60_000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export const DailyWinner = () => {
  const [data, setData] = useState<DailyWinnerResponse | null>(null);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/board/daily-winner');
        if (res.ok) {
          const d = await res.json() as DailyWinnerResponse;
          setData(d);
          setEndAt(Date.now() + d.msUntilNext);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const countdown = useCountdown(endAt);

  if (loading) return <div className="w-full h-screen bg-[#0e0e0e]" />;

  if (!data || data.phase === 'no-winner') {
    return (
      <div className="w-full h-screen bg-[#0e0e0e] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <Trophy className="w-12 h-12 text-[#d93900]" />
        <p className="text-white font-bold text-lg">No winner yet</p>
        <p className="text-gray-400 text-sm">Post your meme to compete!</p>
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
          <Clock className="w-3.5 h-3.5" />
          <span>Next reset in {countdown}</span>
        </div>
      </div>
    );
  }

  const { entry } = data;

  return (
    <div className="relative w-full h-screen bg-[#0e0e0e] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-[#d93900]" />
          <span className="text-white font-bold text-sm">Daily Winner</span>
          <span className="text-gray-400 text-xs ml-1">{entry.date}</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          <span>{countdown}</span>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        {entry.contentType === 'image' && (
          <img src={entry.mediaData} alt={entry.title} className="w-full h-full object-contain" />
        )}
        {entry.contentType === 'video' && (
          <>
            <video src={entry.mediaData} autoPlay muted loop playsInline className="w-full h-full object-contain" />
            <div className="absolute top-2 right-2 flex items-center justify-center w-7 h-7 rounded-full bg-black/50">
              <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
            </div>
          </>
        )}
        {entry.contentType === 'gif' && (
          <>
            <img src={entry.mediaData} alt={entry.title} className="w-full h-full object-contain" />
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs font-bold px-1.5 py-0.5 rounded">
              <Layers className="w-2.5 h-2.5" />
              GIF
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-0 right-0 px-3 flex items-end justify-between">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm truncate">{entry.title}</p>
          <p className="text-gray-400 text-xs">u/{entry.authorUsername}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <span className="text-[#d93900] font-bold text-sm">❤ {entry.likes}</span>
          <span className="text-gray-400 text-sm">💔 {entry.dislikes}</span>
        </div>
      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DailyWinner />
  </StrictMode>
);
