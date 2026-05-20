import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemeEditor } from './components/meme/MemeEditor';
import { MemeViewer } from './components/meme/MemeViewer';
import { VideoEditor } from './components/meme/VideoEditor';
import { VideoViewer } from './components/meme/VideoViewer';
import { GifEditor } from './components/meme/GifEditor';
import { GifViewer } from './components/meme/GifViewer';
import { ContentTypePicker } from './components/meme/ContentTypePicker';
import type { InitResponse } from '../shared/api';

export const App = () => {
  const [initData, setInitData] = useState<InitResponse | null>(null);
  const [contentType, setContentType] = useState<'image' | 'video' | 'gif' | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        setInitData(data);
      } catch (err) {
        console.error('Failed to init', err);
      }
    })();
  }, []);

  if (!initData) {
    return <div className="w-full h-screen bg-[#0e0e0e]" />;
  }

  if (initData.mode === 'viewer') {
    if (initData.contentType === 'video') {
      return (
        <VideoViewer
          videoData={initData.videoData}
          autoPlay
          initialScore={initData.score}
        />
      );
    }
    if (initData.contentType === 'gif') {
      return (
        <GifViewer
          gifData={initData.gifData}
          initialScore={initData.score}
        />
      );
    }
    return (
      <MemeViewer
        imageData={initData.imageData}
        initialScore={initData.score}
      />
    );
  }

  if (!contentType) return <ContentTypePicker onSelect={setContentType} />;
  if (contentType === 'video') return <VideoEditor />;
  if (contentType === 'gif') return <GifEditor />;
  return <MemeEditor />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
