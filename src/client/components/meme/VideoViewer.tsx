import { useState } from 'react';
import { Heart, HeartCrack, Flame, Volume2, VolumeX } from 'lucide-react';
import { navigateTo } from '@devvit/web/client';

type Props = {
  videoData: string;
  autoPlay?: boolean;
  initialLikes: number;
  initialDislikes: number;
  initialUserVote: 'like' | 'dislike' | null;
};

export const VideoViewer = ({
  videoData,
  autoPlay = false,
  initialLikes,
  initialDislikes,
  initialUserVote,
}: Props) => {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(initialUserVote);
  const [voting, setVoting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [muted, setMuted] = useState(true);

  const handleVote = async (action: 'like' | 'dislike') => {
    if (voting || userVote === action) return;

    const prevLikes = likes;
    const prevDislikes = dislikes;
    const prevVote = userVote;

    const wasOpposite = userVote !== null && userVote !== action;

    setUserVote(action);
    setLikes((l) => {
      if (action === 'like') return l + 1;
      if (wasOpposite) return l - 1;
      return l;
    });
    setDislikes((d) => {
      if (action === 'dislike') return d + 1;
      if (wasOpposite) return d - 1;
      return d;
    });

    setVoting(true);
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('vote failed');
      const data = await res.json() as { likes: number; dislikes: number; userVote: 'like' | 'dislike' | null };
      setLikes(data.likes);
      setDislikes(data.dislikes);
      setUserVote(data.userVote);
    } catch {
      setLikes(prevLikes);
      setDislikes(prevDislikes);
      setUserVote(prevVote);
    } finally {
      setVoting(false);
    }
  };

  const handleCreateOwn = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await fetch('/api/create-meme-post', { method: 'POST' });
      if (!res.ok) throw new Error('create failed');
      const data = await res.json() as { postUrl: string };
      navigateTo(data.postUrl);
    } catch {
      setCreating(false);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0e0e0e] flex flex-col items-center justify-center">
      <video
        src={videoData}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        className="w-full h-full object-contain"
      />

      {/* Instagram-style mute toggle — top-right corner */}
      <button
        className="absolute top-4 right-4 flex items-center justify-center w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white pointer-events-auto"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>

      {/* bottom gradient + controls */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

      <div className="absolute bottom-14 left-0 right-0 flex items-center justify-between px-3 pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 text-white cursor-pointer"
            onClick={() => void handleVote('like')}
            aria-label="Like"
          >
            <Heart
              className="w-6 h-6 transition-colors"
              style={{
                color: userVote === 'like' ? '#d93900' : 'white',
                fill: userVote === 'like' ? '#d93900' : 'none',
              }}
            />
            <span className="text-sm font-semibold tabular-nums">{likes}</span>
          </button>

          <button
            className="flex items-center gap-1.5 text-white cursor-pointer"
            onClick={() => void handleVote('dislike')}
            aria-label="Dislike"
          >
            <HeartCrack
              className="w-6 h-6 transition-colors"
              style={{ color: userVote === 'dislike' ? '#888' : 'white' }}
            />
            <span className="text-sm font-semibold tabular-nums">{dislikes}</span>
          </button>
        </div>

        <button
          className="flex items-center gap-1 bg-[#d93900] hover:bg-[#c23300] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-60 shrink-0"
          disabled={creating}
          onClick={() => void handleCreateOwn()}
        >
          <Flame className="w-3.5 h-3.5" />
          {creating ? 'Creating...' : 'Create Yours'}
        </button>
      </div>
    </div>
  );
};
