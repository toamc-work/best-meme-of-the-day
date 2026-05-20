import { ImageIcon, Video, Layers } from 'lucide-react';

type Props = {
  onSelect: (type: 'image' | 'video' | 'gif') => void;
};

export const ContentTypePicker = ({ onSelect }: Props) => (
  <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center gap-6 p-4">
    <span className="bg-[#d93900] text-white text-xs font-bold px-2.5 py-0.5 rounded">NEW</span>
    <h1 className="text-3xl md:text-5xl font-bold text-white text-center">
      Cook the <span className="text-[#d93900]">Meme</span>
    </h1>
    <p className="text-gray-400 text-sm md:text-base">What are you cooking?</p>

    <div className="flex flex-wrap gap-3 justify-center mt-2">
      <button
        className="flex flex-col items-center gap-3 bg-[#1a1a1a] border-2 border-gray-700 hover:border-[#d93900] rounded-xl px-6 py-6 text-white transition-colors cursor-pointer"
        onClick={() => onSelect('image')}
      >
        <ImageIcon className="w-8 h-8 text-[#d93900]" strokeWidth={1.5} />
        <span className="font-bold text-sm">Image</span>
        <span className="text-gray-500 text-xs">Meme with text</span>
      </button>

      <button
        className="flex flex-col items-center gap-3 bg-[#1a1a1a] border-2 border-gray-700 hover:border-[#d93900] rounded-xl px-6 py-6 text-white transition-colors cursor-pointer"
        onClick={() => onSelect('gif')}
      >
        <Layers className="w-8 h-8 text-[#d93900]" strokeWidth={1.5} />
        <span className="font-bold text-sm">GIF</span>
        <span className="text-gray-500 text-xs">Animated</span>
      </button>

      <button
        className="flex flex-col items-center gap-3 bg-[#1a1a1a] border-2 border-gray-700 hover:border-[#d93900] rounded-xl px-6 py-6 text-white transition-colors cursor-pointer"
        onClick={() => onSelect('video')}
      >
        <Video className="w-8 h-8 text-[#d93900]" strokeWidth={1.5} />
        <span className="font-bold text-sm">Video</span>
        <span className="text-gray-500 text-xs">Short clip</span>
      </button>
    </div>

    <p className="text-gray-600 text-sm mt-1">🔥 No boring memes. Only heat.</p>
  </div>
);
