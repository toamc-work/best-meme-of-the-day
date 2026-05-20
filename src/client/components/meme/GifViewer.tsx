import { ArrowBigUp, Flame } from 'lucide-react';
import { navigateTo } from '@devvit/web/client';
import { useState } from 'react';

type Props = {
  gifData: string;
  initialScore: number;
};

export const GifViewer = ({ gifData, initialScore }: Props) => {
  const [creating, setCreating] = useState(false);

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
    <div className="relative w-full h-screen overflow-hidden bg-[#0e0e0e] flex items-center justify-center">
      <img src={gifData} alt="Meme GIF" className="w-full h-full object-contain" />

      <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-3 pointer-events-auto">
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
