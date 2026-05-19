import { useCallback, useEffect, useRef, useState } from 'react';
import { navigateTo, showToast } from '@devvit/web/client';
import type { PostMemeRequest, PostMemeResponse } from '../../shared/api';

export type TextLayerData = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  locked: boolean;
};

type MemeEditorState = {
  image: File | null;
  imageUrl: string | null;
  layers: TextLayerData[];
  selectedLayerId: string | null;
  submitting: boolean;
};

export const useMemeEditor = () => {
  const [state, setState] = useState<MemeEditorState>({
    image: null,
    imageUrl: null,
    layers: [],
    selectedLayerId: null,
    submitting: false,
  });

  const stateRef = useRef(state);
  // eslint-disable-next-line react-hooks/refs
  stateRef.current = state;

  useEffect(() => {
    return () => {
      if (stateRef.current.imageUrl) {
        URL.revokeObjectURL(stateRef.current.imageUrl);
      }
    };
  }, []);

  const setImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setState((prev) => {
      if (prev.imageUrl) URL.revokeObjectURL(prev.imageUrl);
      return { ...prev, image: file, imageUrl: url };
    });
  }, []);

  const addLayer = useCallback(() => {
    const newLayer: TextLayerData = {
      id: crypto.randomUUID(),
      text: 'Text',
      x: 50,
      y: 50,
      fontSize: 24,
      locked: false,
    };
    setState((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<TextLayerData>) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
      selectedLayerId: prev.selectedLayerId === id ? null : prev.selectedLayerId,
    }));
  }, []);

  const toggleLock = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l
      ),
      selectedLayerId: prev.selectedLayerId === id ? null : prev.selectedLayerId,
    }));
  }, []);

  const selectLayer = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedLayerId: id }));
  }, []);

  const exportAndSubmit = useCallback(
    async (title: string) => {
      if (stateRef.current.submitting) return;
      const { imageUrl, layers } = stateRef.current;
      if (!imageUrl) return;

      setState((prev) => ({ ...prev, submitting: true }));

      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.drawImage(img, 0, 0);

        for (const layer of layers) {
          const scaledSize = layer.fontSize * (img.naturalWidth / 500);
          ctx.font = `bold ${scaledSize}px Impact, Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'white';
          const x = (layer.x / 100) * img.naturalWidth;
          const y = (layer.y / 100) * img.naturalHeight;
          ctx.strokeText(layer.text, x, y);
          ctx.fillText(layer.text, x, y);
        }

        const imageData = canvas.toDataURL('image/png');

        const res = await fetch('/api/post-meme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData, title } satisfies PostMemeRequest),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PostMemeResponse = await res.json();
        navigateTo(data.postUrl);
      } catch (err) {
        console.error('Failed to post meme', err);
        showToast('Failed to post meme');
      } finally {
        setState((prev) => ({ ...prev, submitting: false }));
      }
    },
    []
  );

  return {
    ...state,
    setImage,
    addLayer,
    updateLayer,
    deleteLayer,
    toggleLock,
    selectLayer,
    exportAndSubmit,
  } as const;
};
