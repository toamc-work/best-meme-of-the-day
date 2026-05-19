import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type Props = {
  onImageSelected: (file: File) => void;
};

export const ImageUpload = ({ onImageSelected }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    onImageSelected(file);
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
        isDragging
          ? 'border-[#d93900] bg-orange-50 dark:bg-orange-900/10'
          : 'border-gray-300 dark:border-gray-600 hover:border-[#d93900]'
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
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Drop image or click to upload
      </p>
      <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">PNG, JPG, GIF</p>
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
