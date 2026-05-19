import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemeEditor } from './components/meme/MemeEditor';
import { MemeViewer } from './components/meme/MemeViewer';
import type { InitResponse } from '../shared/api';

export const App = () => {
  const [initData, setInitData] = useState<InitResponse | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        setInitData(data);
      } catch (err) {
        console.error('Failed to init', err);
      }
    };
    void init();
  }, []);

  if (!initData) return null;
  if (initData.mode === 'viewer') return <MemeViewer imageData={initData.imageData} />;
  return <MemeEditor />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
