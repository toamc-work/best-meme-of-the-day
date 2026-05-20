import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Flame, Play, Layers, ArrowBigUp } from 'lucide-react';
import { MemeViewer } from './components/meme/MemeViewer';
import type { InitResponse } from '../shared/api';

export const Splash = () => {
  const [initData, setInitData] = useState<InitResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/init');
        if (res.ok) {
          const data = await (res.json() as Promise<InitResponse>);
          setInitData(data);
        }
      } catch {
        // fall through to editor CTA
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="w-full h-screen bg-[#0e0e0e]" />;
  }

  if (initData?.mode === 'viewer') {
    if (initData.contentType === 'video') {
      return (
        <div className="relative w-full h-screen overflow-hidden bg-[#0e0e0e] flex items-center justify-center">
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
          >
            <video
              src={initData.videoData}
              muted
              playsInline
              preload="metadata"
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm">
                <Play className="w-7 h-7 text-white fill-white ml-1" />
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-3 pointer-events-auto">
            <div className="flex items-center gap-1">
              <ArrowBigUp
                className="w-5 h-5"
                style={{ color: initData.score > 0 ? '#d93900' : '#6b7280' }}
              />
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: initData.score > 0 ? '#d93900' : '#6b7280' }}
              >
                {initData.score}
              </span>
            </div>

            <button
              className="flex items-center gap-1 bg-[#d93900] hover:bg-[#c23300] text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors shrink-0"
              onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
            >
              <Flame className="w-3.5 h-3.5" />
              Create Yours
            </button>
          </div>
        </div>
      );
    }

    if (initData.contentType === 'gif') {
      return (
        <div className="relative w-full h-screen overflow-hidden bg-[#0e0e0e] flex items-center justify-center">
          <div
            className="absolute inset-0 flex items-center justify-center cursor-pointer"
            onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
          >
            <img
              src={initData.gifData}
              alt="GIF meme"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded pointer-events-none">
              <Layers className="w-3 h-3" />
              GIF
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />

          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-between px-5 pointer-events-auto">
            <div className="flex items-center gap-1">
              <ArrowBigUp
                className="w-5 h-5"
                style={{ color: initData.score > 0 ? '#d93900' : '#6b7280' }}
              />
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: initData.score > 0 ? '#d93900' : '#6b7280' }}
              >
                {initData.score}
              </span>
            </div>

            <button
              className="flex items-center gap-1.5 bg-[#d93900] hover:bg-[#c23300] text-white text-sm font-bold px-4 py-1.5 rounded-full transition-colors"
              onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
            >
              <Flame className="w-4 h-4" />
              Create Yours
            </button>
          </div>
        </div>
      );
    }

    return (
      <MemeViewer
        imageData={initData.imageData}
        initialScore={initData.score}
      />
    );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0e0e0e] flex flex-col items-center justify-center gap-4">
      <span className="bg-[#d93900] text-white text-xs font-bold px-2.5 py-0.5 rounded">
        NEW
      </span>
      <h1 className="text-2xl font-bold text-white">
        Meme of the <span className="text-[#d93900]">Day</span>
      </h1>
      <button
        className="bg-[#d93900] hover:bg-[#c23300] text-white rounded-full px-6 py-2.5 font-bold text-sm transition-colors"
        onClick={(e) => requestExpandedMode(e.nativeEvent, 'game')}
      >
        Cook a Meme
      </button>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);
