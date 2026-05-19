import { useState } from 'react';
import { useMemeEditor } from '@/hooks/useMemeEditor';
import { ImageUpload } from './ImageUpload';
import { MemeCanvas } from './MemeCanvas';
import { TextLayerControls } from './TextLayerControls';
import { Button } from '@/components/ui/button';

export const MemeEditor = () => {
  const [title, setTitle] = useState('');
  const {
    imageUrl,
    layers,
    selectedLayerId,
    submitting,
    setImage,
    addLayer,
    updateLayer,
    deleteLayer,
    toggleLock,
    selectLayer,
    exportAndSubmit,
  } = useMemeEditor();

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;

  return (
    <div className="flex flex-col gap-4 p-4 min-h-screen bg-white dark:bg-gray-900">
      {!imageUrl ? (
        <ImageUpload onImageSelected={setImage} />
      ) : (
        <>
          <MemeCanvas
            imageUrl={imageUrl}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={selectLayer}
            onUpdateLayer={updateLayer}
          />
          {selectedLayer !== null && (
            <TextLayerControls
              layer={selectedLayer}
              onUpdate={(patch) => updateLayer(selectedLayer.id, patch)}
              onDelete={() => deleteLayer(selectedLayer.id)}
              onToggleLock={() => toggleLock(selectedLayer.id)}
            />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={addLayer}
            className="self-start"
          >
            + Add Text
          </Button>
          <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <input
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#d93900]"
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Button
              className="bg-[#d93900] hover:bg-[#c23300] text-white shrink-0"
              disabled={submitting || title.trim().length === 0}
              onClick={() => void exportAndSubmit(title)}
            >
              {submitting ? 'Posting...' : 'Post Meme'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
