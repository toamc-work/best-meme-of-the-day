import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { PlayCircle } from 'lucide-react';
import { MemeViewer } from './components/meme/MemeViewer';
import { VideoViewer } from './components/meme/VideoViewer';
import type { InitResponse } from '../shared/api';

export const Splash = () => {
  const [initData, setInitData] = useState<InitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/init');
        if (res.ok) setInitData(await (res.json() as Promise<InitResponse>));
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
      if (videoPlaying) {
        return (
          <VideoViewer
            videoData={initData.videoData}
            autoPlay
            initialLikes={initData.likes}
            initialDislikes={initData.dislikes}
            initialUserVote={initData.userVote}
          />
        );
      }

      // Show thumbnail (or dark bg if no thumbnail) with a centered play button
      return (
        <div
          className="relative w-full h-screen overflow-hidden bg-[#0e0e0e] flex items-center justify-center cursor-pointer"
          onClick={() => setVideoPlaying(true)}
        >
          {initData.thumbnailData ? (
            <img
              src={initData.thumbnailData}
              alt={initData.title}
              className="w-full h-full object-contain"
            />
          ) : null}

          {/* gradient overlay so the play icon is always readable */}
          <div className="absolute inset-0 bg-black/30" />

          <div className="absolute inset-0 flex items-center justify-center">
            <PlayCircle className="w-16 h-16 text-white drop-shadow-lg" strokeWidth={1.5} />
          </div>
        </div>
      );
    }

    return (
      <MemeViewer
        imageData={initData.imageData}
        initialLikes={initData.likes}
        initialDislikes={initData.dislikes}
        initialUserVote={initData.userVote}
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
