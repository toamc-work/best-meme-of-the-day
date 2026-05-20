import { useRef, useState } from 'react';
import { CloudUpload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAX_IMAGE_FILE_MB } from '../../../shared/api';

type Props = {
  onImageSelected: (file: File) => void;
};

export const ImageUpload = ({ onImageSelected }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > MAX_IMAGE_FILE_MB * 1024 * 1024) {
      setSizeError(`Image is too large. Max size is ${MAX_IMAGE_FILE_MB} MB.`);
      return;
    }
    setSizeError(null);
    onImageSelected(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="bg-[#d93900] text-white text-xs font-bold px-2.5 py-0.5 rounded">
        NEW
      </span>

      <h1 className="text-3xl md:text-5xl font-bold text-white">
        Cook the <span className="text-[#d93900]">Meme</span>
      </h1>

      <p className="text-gray-400 text-sm md:text-base mb-2">Upload your masterpiece</p>

      <div
        className={cn(
          'w-80 md:w-[500px] h-56 md:h-80 rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-3 transition-colors bg-[#1a1a1a]',
          isDragging
            ? 'border-[#d93900]'
            : 'border-[#d93900]/60 hover:border-[#d93900]'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {/* icon with pulsing orange glow behind it */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full bg-[#d93900]/25 blur-2xl animate-pulse" />
          <CloudUpload
            className="relative w-10 h-10 md:w-14 md:h-14 text-[#d93900]"
            strokeWidth={1.5}
          />
        </div>

        <div className="text-center">
          <p className="text-white font-medium">
            Drop your <span className="text-[#d93900]">image</span> here
          </p>
          <p className="text-gray-400 text-sm">or click to upload</p>
        </div>
      </div>

      {sizeError && (
        <p className="text-red-400 text-sm font-medium">{sizeError}</p>
      )}
      <p className="text-gray-500 text-sm mt-1">🔥 No boring memes. Only heat.</p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
};
