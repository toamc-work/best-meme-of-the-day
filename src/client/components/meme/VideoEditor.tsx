import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { navigateTo } from '@devvit/web/client';
import { VideoUpload } from './VideoUpload';
import { Button } from '@/components/ui/button';

export const VideoEditor = () => {
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const setVideo = (file: File) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setVideoFile(file);
    setVideoUrl(url);
  };

  const clearVideo = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setVideoFile(null);
    setVideoUrl(null);
  };

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handlePost = async () => {
    if (!videoFile || !title.trim() || submitting) return;
    setSubmitting(true);

    try {
      const videoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(videoFile);
      });

      const res = await fetch('/api/post-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoData, title: title.trim() }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as { postUrl: string };
      navigateTo(data.postUrl);
    } catch (err) {
      console.error('Failed to post video', err);
      setSubmitting(false);
    }
  };

  if (!videoUrl) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
        <VideoUpload onVideoSelected={setVideo} />
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

        <video
          src={videoUrl}
          controls
          className="w-full bg-black"
          style={{ maxHeight: '60vh' }}
        />

        <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700 min-h-[44px]">
          <button
            className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0"
            onClick={clearVideo}
            aria-label="Remove video"
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
