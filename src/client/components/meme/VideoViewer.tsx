import { useState } from 'react';
import { Heart, ThumbsDown, Flame } from 'lucide-react';
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

  const handleVote = async (action: 'like' | 'dislike') => {
    if (voting) return;

    const prevLikes = likes;
    const prevDislikes = dislikes;
    const prevVote = userVote;

    const toggling = userVote === action;
    const wasOpposite = userVote !== null && userVote !== action;

    setUserVote(toggling ? null : action);
    setLikes((l) => {
      if (action === 'like') return toggling ? l - 1 : l + 1;
      if (wasOpposite) return l - 1;
      return l;
    });
    setDislikes((d) => {
      if (action === 'dislike') return toggling ? d - 1 : d + 1;
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
        controls
        autoPlay={autoPlay}
        className="w-full h-full object-contain"
      />

      {/* bottom gradient + controls */}
      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-5 pointer-events-auto">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-1.5 text-white"
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
            className="flex items-center gap-1.5 text-white"
            onClick={() => void handleVote('dislike')}
            aria-label="Dislike"
          >
            <ThumbsDown
              className="w-5 h-5 transition-colors"
              style={{ color: userVote === 'dislike' ? '#888' : 'white' }}
            />
            <span className="text-sm font-semibold tabular-nums">{dislikes}</span>
          </button>
        </div>

        <button
          className="flex items-center gap-1.5 bg-[#d93900] hover:bg-[#c23300] text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors disabled:opacity-60"
          disabled={creating}
          onClick={() => void handleCreateOwn()}
        >
          <Flame className="w-4 h-4" />
          {creating ? 'Creating...' : 'Create Yours'}
        </button>
      </div>
    </div>
  );
};
