import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Flame, Clock, Play, Layers, Heart, HeartCrack, Trophy } from 'lucide-react';
import type { WeeklyLeaderboardResponse, WeeklyCandidate } from '../shared/api';

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

const CandidateRow = ({
  candidate,
  rank,
  phase,
  onVote,
  voting,
}: {
  candidate: WeeklyCandidate;
  rank: number;
  phase: string;
  onVote: (postId: string, action: 'like' | 'dislike') => void;
  voting: string | null;
}) => {
  const isVoting = voting === candidate.postId;
  return (
    <div className="px-3 py-2.5 border-b border-white/5">
      <div className="flex items-start gap-2">
        <span className="text-gray-500 text-xs w-4 shrink-0 mt-0.5">#{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 mb-0.5">
            {candidate.contentType === 'video' && <Play className="w-3 h-3 text-gray-400 shrink-0" />}
            {candidate.contentType === 'gif' && <Layers className="w-3 h-3 text-gray-400 shrink-0" />}
            <p className="text-white text-sm font-medium truncate">{candidate.title}</p>
          </div>
          <p className="text-gray-500 text-xs">u/{candidate.authorUsername}</p>
        </div>
      </div>
      {phase === 'active' && (
        <div className="flex items-center gap-3 mt-2 ml-6">
          <button
            className="flex items-center gap-1 text-xs"
            onClick={() => onVote(candidate.postId, 'like')}
            disabled={isVoting}
          >
            <Heart
              className="w-4 h-4"
              style={{
                color: candidate.userVote === 'like' ? '#d93900' : 'white',
                fill: candidate.userVote === 'like' ? '#d93900' : 'none',
              }}
            />
            <span className="text-white font-semibold tabular-nums">{candidate.likes}</span>
          </button>
          <button
            className="flex items-center gap-1 text-xs"
            onClick={() => onVote(candidate.postId, 'dislike')}
            disabled={isVoting}
          >
            <HeartCrack
              className="w-4 h-4"
              style={{ color: candidate.userVote === 'dislike' ? '#888' : 'white' }}
            />
            <span className="text-white font-semibold tabular-nums">{candidate.dislikes}</span>
          </button>
        </div>
      )}
      {phase !== 'active' && (
        <div className="flex items-center gap-3 mt-1 ml-6 text-xs text-gray-400">
          <span>❤ {candidate.likes}</span>
          <span>💔 {candidate.dislikes}</span>
        </div>
      )}
    </div>
  );
};

export const WeeklyLeaderboard = () => {
  const [data, setData] = useState<WeeklyLeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/board/weekly-leaderboard');
        if (res.ok) setData(await res.json() as WeeklyLeaderboardResponse);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const countdown = useCountdown(data?.endMs ?? null);

  const handleVote = async (postId: string, action: 'like' | 'dislike') => {
    if (voting) return;
    setVoting(postId);

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        candidates: prev.candidates.map((c) => {
          if (c.postId !== postId) return c;
          const toggling = c.userVote === action;
          const wasOpposite = c.userVote !== null && c.userVote !== action;
          return {
            ...c,
            userVote: toggling ? null : action,
            likes: action === 'like' ? (toggling ? c.likes - 1 : c.likes + 1) : wasOpposite ? c.likes - 1 : c.likes,
            dislikes: action === 'dislike' ? (toggling ? c.dislikes - 1 : c.dislikes + 1) : wasOpposite ? c.dislikes - 1 : c.dislikes,
          };
        }),
      };
    });

    try {
      const res = await fetch('/api/board/weekly-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action }),
      });
      if (res.ok) {
        const result = await res.json() as { postId: string; likes: number; dislikes: number; userVote: 'like' | 'dislike' | null };
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            candidates: prev.candidates.map((c) =>
              c.postId === result.postId ? { ...c, likes: result.likes, dislikes: result.dislikes, userVote: result.userVote } : c
            ),
          };
        });
      }
    } catch {
      // keep optimistic update
    } finally {
      setVoting(null);
    }
  };

  if (loading) return <div className="w-full h-screen bg-[#0e0e0e]" />;

  const phaseLabel = {
    collecting: 'Collecting candidates',
    active: 'Vote now!',
    ended: 'Battle ended',
  }[data?.phase ?? 'collecting'];

  return (
    <div className="w-full h-screen bg-[#0e0e0e] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-[#d93900]" />
          <span className="text-white font-bold text-sm">Weekly Battle</span>
          <span className="text-gray-500 text-xs">R{data?.round ?? 1}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-xs font-semibold ${data?.phase === 'active' ? 'text-[#d93900]' : 'text-gray-400'}`}>
            {phaseLabel}
          </span>
          {data?.phase === 'active' && data.endMs && (
            <div className="flex items-center gap-0.5 text-gray-400 text-xs">
              <Clock className="w-3 h-3" />
              <span>{countdown}</span>
            </div>
          )}
        </div>
      </div>

      {data?.phase === 'collecting' && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 text-center">
          <Trophy className="w-10 h-10 text-gray-600" />
          <p className="text-white font-semibold">Collecting candidates</p>
          <p className="text-gray-400 text-sm">
            {data.candidates.length}/6 daily winners collected
          </p>
          <p className="text-gray-500 text-xs">Battle starts when 6 daily winners are collected</p>
        </div>
      )}

      {(data?.phase === 'active' || data?.phase === 'ended') && (
        <div className="flex-1 overflow-y-auto">
          {data.candidates.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">No candidates yet</p>
            </div>
          ) : (
            data.candidates.map((c, i) => (
              <CandidateRow
                key={c.postId}
                candidate={c}
                rank={i + 1}
                phase={data.phase}
                onVote={handleVote}
                voting={voting}
              />
            ))
          )}
          {data.phase === 'ended' && data.winnerId && (
            <div className="px-3 py-2 bg-[#d93900]/10 border-t border-[#d93900]/30">
              <p className="text-[#d93900] text-xs font-bold text-center">🏆 Battle ended — see Weekly Champion!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WeeklyLeaderboard />
  </StrictMode>
);
