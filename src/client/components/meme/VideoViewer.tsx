import { useState } from 'react';
import { ArrowBigUp, Flame, Volume2, VolumeX } from 'lucide-react';
import { navigateTo } from '@devvit/web/client';

type Props = {
  videoData: string;
  autoPlay?: boolean;
  initialScore: number;
};

export const VideoViewer = ({
  videoData,
  autoPlay = false,
  initialScore,
}: Props) => {
  const [creating, setCreating] = useState(false);
  const [muted, setMuted] = useState(true);

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

      {/* mute toggle — top-right */}
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
        <div className="flex items-center gap-1">
          <ArrowBigUp
            className="w-5 h-5"
            style={{ color: initialScore > 0 ? '#d93900' : '#6b7280' }}
          />
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: initialScore > 0 ? '#d93900' : '#6b7280' }}
          >
            {initialScore}
          </span>
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
