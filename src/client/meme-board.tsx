import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Clapperboard, Play, Layers, Image, ChevronLeft, ChevronRight } from 'lucide-react';
import type { MemeBoardResponse, MemeBoardEntry } from '../shared/api';

function TypeIcon({ type }: { type: MemeBoardEntry['contentType'] }) {
  if (type === 'video') return <Play className="w-3 h-3 text-gray-400 shrink-0" />;
  if (type === 'gif') return <Layers className="w-3 h-3 text-gray-400 shrink-0" />;
  return <Image className="w-3 h-3 text-gray-400 shrink-0" />;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export const MemeBoard = () => {
  const [data, setData] = useState<MemeBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/board/meme-board?page=${p}`);
      if (res.ok) {
        setData(await res.json() as MemeBoardResponse);
        setPage(p);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/board/meme-board?page=0');
        if (res.ok) {
          setData(await res.json() as MemeBoardResponse);
          setPage(0);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pageSize = 20;
  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="w-full h-screen bg-[#0e0e0e] flex flex-col overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black/40 shrink-0">
        <div className="flex items-center gap-1.5">
          <Clapperboard className="w-4 h-4 text-[#d93900]" />
          <span className="text-white font-bold text-sm">Meme Board</span>
        </div>
        {data && (
          <span className="text-gray-400 text-xs">{data.total} memes</span>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-[#d93900] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.entries.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 text-sm">No memes posted yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {data.entries.map((entry, i) => (
            <div key={entry.postId} className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="text-gray-600 text-xs w-6 text-right shrink-0">
                {page * pageSize + i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <TypeIcon type={entry.contentType} />
                  <p className="text-white text-sm font-medium truncate">{entry.title}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>u/{entry.authorUsername}</span>
                  <span>·</span>
                  <span>{timeAgo(entry.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 px-3 py-2 bg-black/40 shrink-0">
          <button
            className="flex items-center gap-1 text-gray-400 text-xs disabled:opacity-30"
            disabled={page === 0 || loading}
            onClick={() => void load(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="text-gray-400 text-xs">{page + 1} / {totalPages}</span>
          <button
            className="flex items-center gap-1 text-gray-400 text-xs disabled:opacity-30"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => void load(page + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemeBoard />
  </StrictMode>
);
