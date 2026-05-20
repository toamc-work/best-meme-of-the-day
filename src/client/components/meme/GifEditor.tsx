import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { navigateTo } from '@devvit/web/client';
import { GifUpload } from './GifUpload';
import { Button } from '@/components/ui/button';
import { MAX_GIF_FILE_MB } from '../../../shared/api';
import type { PostGifRequest, PostGifResponse } from '../../../shared/api';

export const GifEditor = () => {
  const [title, setTitle] = useState('');
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const handleGifSelected = (file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setGifFile(file);
    setGifUrl(url);
    setError(null);
  };

  const clearGif = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setGifFile(null);
    setGifUrl(null);
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handlePost = async () => {
    if (!gifFile || !title.trim() || submitting) return;

    if (gifFile.size > MAX_GIF_FILE_MB * 1024 * 1024) {
      setError(`GIF is too large. Max size is ${MAX_GIF_FILE_MB} MB.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const gifData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(gifFile);
      });

      const body: PostGifRequest = { gifData, title: title.trim() };
      const res = await fetch('/api/post-gif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as PostGifResponse;
      navigateTo(data.postUrl);
    } catch (err) {
      const is500 = err instanceof Error && err.message.includes('500');
      setError(is500 ? 'GIF is too large to upload. Try a smaller file.' : 'Failed to post — please try again.');
      setSubmitting(false);
    }
  };

  if (!gifUrl) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
        <GifUpload onGifSelected={handleGifSelected} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
      <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl rounded-xl border border-gray-700 bg-[#1a1a1a] overflow-hidden">
        <input
          className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 text-sm md:text-base border-b border-gray-700 focus:outline-none focus:border-b-[#d93900]"
          placeholder="Add a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <img
          src={gifUrl}
          alt="GIF preview"
          className="w-full bg-black object-contain"
          style={{ maxHeight: '60vh' }}
        />

        {error && (
          <p className="text-red-400 text-sm font-medium px-4 py-2 border-t border-gray-700">{error}</p>
        )}

        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700 min-h-[44px]">
          <button
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0"
            onClick={clearGif}
            aria-label="Remove GIF"
          >
            <X className="w-5 h-5" />
          </button>

          <Button
            className="bg-[#d93900] hover:bg-[#c23300] text-white rounded-full px-5 shrink-0"
            disabled={submitting || title.trim().length === 0}
            onClick={() => void handlePost()}
          >
            {submitting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </div>
    </div>
  );
};
