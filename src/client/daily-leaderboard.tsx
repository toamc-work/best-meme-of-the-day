import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart2, Clock, Image, Play, Layers, ArrowBigUp } from 'lucide-react';
import type { DailyLeaderboardResponse, DailyLeaderboardEntry } from '../shared/api';

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

function TypeBadge({ type }: { type: DailyLeaderboardEntry['contentType'] }) {
  if (type === 'video') return <Play className="w-3 h-3 text-gray-400" />;
  if (type === 'gif') return <Layers className="w-3 h-3 text-gray-400" />;
  return <Image className="w-3 h-3 text-gray-400" />;
}

function medalEmoji(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

export const DailyLeaderboard = () => {
  const [data, setData] = useState<DailyLeaderboardResponse | null>(null);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/board/daily-leaderboard');
        if (res.ok) {
          const d = await res.json() as DailyLeaderboardResponse;
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

  return (
    <div className="w-full h-screen bg-[#0e0e0e] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <BarChart2 className="w-4 h-4 text-[#d93900]" />
          <span className="text-white font-bold text-sm">Daily Leaderboard</span>
        </div>
        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3 h-3" />
          <span>{countdown}</span>
        </div>
      </div>

      {!data || data.entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No memes posted today yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {data.entries.map((entry) => (
            <div key={entry.postId} className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="w-6 text-center text-sm shrink-0">{medalEmoji(entry.rank)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <TypeBadge type={entry.contentType} />
                  <p className="text-white text-sm font-medium truncate">{entry.title}</p>
                </div>
                <p className="text-gray-500 text-xs">u/{entry.authorUsername}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ArrowBigUp
                  className="w-4 h-4"
                  style={{ color: entry.score > 0 ? '#d93900' : '#6b7280' }}
                />
                <span
                  className="text-sm font-semibold tabular-nums"
                  style={{ color: entry.score > 0 ? '#d93900' : '#6b7280' }}
                >
                  {entry.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DailyLeaderboard />
  </StrictMode>
);
