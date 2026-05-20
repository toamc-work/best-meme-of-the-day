import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Crown, Play, Layers, Clock, Trophy } from 'lucide-react';
import type { WeeklyWinnerResponse } from '../shared/api';

function useCountdown(ms: number | null) {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!ms) return;
    const id = setInterval(() => setRemaining(Math.max(0, ms - Date.now())), 1000);
    return () => clearInterval(id);
  }, [ms]);
  const d = Math.floor(remaining / 86_400_000);
  const h = Math.floor((remaining % 86_400_000) / 3_600_000);
  const m = Math.floor((remaining % 3_600_000) / 60_000);
  if (d > 0) return `${d}d ${h}h`;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export const WeeklyWinner = () => {
  const [data, setData] = useState<WeeklyWinnerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/board/weekly-winner');
        if (res.ok) setData(await res.json() as WeeklyWinnerResponse);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const endMs = data && data.phase !== 'ended' ? data.endMs : null;
  const countdown = useCountdown(endMs);

  if (loading) return <div className="w-full h-screen bg-[#0e0e0e]" />;

  if (!data || data.phase !== 'ended') {
    const candidateCount = data?.candidateCount ?? 0;
    const phase = data?.phase ?? 'collecting';
    return (
      <div className="w-full h-screen bg-[#0e0e0e] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <Crown className="w-12 h-12 text-gray-600" />
        <p className="text-white font-bold text-lg">No champion yet</p>
        {phase === 'collecting' && (
          <p className="text-gray-400 text-sm">{candidateCount}/6 daily winners collected</p>
        )}
        {phase === 'active' && endMs && (
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Battle ends in {countdown}</span>
          </div>
        )}
        <p className="text-gray-500 text-xs">Win a day to compete for the weekly crown!</p>
      </div>
    );
  }

  const { entry, round } = data;
  if (!entry) {
    return (
      <div className="w-full h-screen bg-[#0e0e0e] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <Crown className="w-12 h-12 text-yellow-400" />
        <p className="text-white font-bold text-lg">Champion data unavailable</p>
        <p className="text-gray-500 text-xs">Round {round}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-[#0e0e0e] flex flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <Crown className="w-4 h-4 text-yellow-400" />
          <span className="text-white font-bold text-sm">Weekly Champion</span>
          <span className="text-gray-500 text-xs">R{round}</span>
        </div>
        <Trophy className="w-4 h-4 text-yellow-400" />
      </div>

      {/* media */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center">
        {entry.contentType === 'image' && (
          <img src={entry.mediaData} alt={entry.title} className="w-full h-full object-contain" />
        )}
        {entry.contentType === 'video' && (
          <>
            <video
              src={entry.mediaData}
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-contain"
            />
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

      {/* footer */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-2 left-0 right-0 px-3 flex items-end justify-between">
        <div className="min-w-0">
          <p className="text-yellow-400 text-xs font-bold mb-0.5">👑 Champion</p>
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
    <WeeklyWinner />
  </StrictMode>
);
