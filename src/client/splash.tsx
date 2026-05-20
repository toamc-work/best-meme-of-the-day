import './index.css';

import { requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { InitResponse } from '../shared/api';

export const Splash = () => {
  const [initData, setInitData] = useState<InitResponse | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/init');
        if (res.ok) setInitData(await (res.json() as Promise<InitResponse>));
      } catch {
        // fall through to editor CTA
      }
    })();
  }, []);

  if (initData?.mode === 'viewer') {
    return (
      <div className="w-full h-screen overflow-hidden bg-[#0e0e0e] flex items-center justify-center">
        <img
          src={initData.imageData}
          alt="Meme"
          className="w-full h-full object-contain"
        />
      </div>
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
