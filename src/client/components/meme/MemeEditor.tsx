import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { useMemeEditor } from '@/hooks/useMemeEditor';
import { ImageUpload } from './ImageUpload';
import { MemeCanvas } from './MemeCanvas';
import { Button } from '@/components/ui/button';

export const MemeEditor = () => {
  const [title, setTitle] = useState('');
  const {
    imageUrl,
    layers,
    editingLayerId,
    submitting,
    setImage,
    clearImage,
    addLayer,
    updateLayer,
    deleteLayer,
    startEdit,
    finishEdit,
    exportAndSubmit,
  } = useMemeEditor();

  const editingLayer = editingLayerId
    ? (layers.find((l) => l.id === editingLayerId) ?? null)
    : null;

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
      {!imageUrl ? (
        <ImageUpload onImageSelected={setImage} />
      ) : (
        <div className="w-full max-w-md md:max-w-xl lg:max-w-3xl rounded-xl border border-gray-700 bg-[#1a1a1a] overflow-hidden">
          <input
            className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-500 text-sm md:text-base border-b border-gray-700 focus:outline-none focus:border-b-[#d93900]"
            placeholder="Add a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <MemeCanvas
            imageUrl={imageUrl}
            layers={layers}
            editingLayerId={editingLayerId}
            onStartEdit={startEdit}
            onFinishEdit={finishEdit}
            onUpdateLayer={updateLayer}
            onDeleteLayer={deleteLayer}
            onAddLayer={addLayer}
          />

          <div className="flex items-center justify-between px-3 py-2 border-t border-gray-700 min-h-[44px]">
            <button
              className="text-gray-500 hover:text-gray-300 transition-colors p-1 shrink-0"
              onClick={clearImage}
              aria-label="Remove image"
            >
              <X className="w-5 h-5" />
            </button>

            {editingLayer ? (
              /* font size range + delete — shown while a text layer is focused.
                 data-text-controls lets the textarea's onBlur skip finishEdit
                 so the slider doesn't collapse the edit state mid-drag. */
              <div
                data-text-controls
                className="flex items-center gap-2"
              >
                <span className="text-gray-500 text-xs shrink-0">Size</span>
                <input
                  type="range"
                  min={12}
                  max={96}
                  step={2}
                  value={editingLayer.fontSize}
                  className="w-24 md:w-36 accent-[#d93900] cursor-pointer"
                  onChange={(e) =>
                    updateLayer(editingLayer.id, { fontSize: Number(e.target.value) })
                  }
                />
                <span className="text-gray-400 text-xs w-7 text-center tabular-nums shrink-0">
                  {editingLayer.fontSize}
                </span>
                <div className="w-px h-4 bg-gray-600 shrink-0" />
                <button
                  className="text-[#d93900] hover:text-red-400 w-7 h-7 flex items-center justify-center rounded hover:bg-gray-700 transition-colors shrink-0"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    deleteLayer(editingLayer.id);
                    finishEdit();
                  }}
                  aria-label="Delete text layer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <span className="text-gray-600 text-xs">
                {layers.length > 0
                  ? `${layers.length} ${layers.length === 1 ? 'layer' : 'layers'}`
                  : null}
              </span>
            )}

            <Button
              className="bg-[#d93900] hover:bg-[#c23300] text-white rounded-full px-5 shrink-0"
              disabled={submitting || title.trim().length === 0}
              onClick={() => void exportAndSubmit(title)}
            >
              {submitting ? 'Posting...' : 'Post'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
