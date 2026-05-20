import React from 'react';
import type { TextLayerData } from '@/hooks/useMemeEditor';
import { TextLayer } from './TextLayer';

type Props = {
  imageUrl: string;
  layers: TextLayerData[];
  editingLayerId: string | null;
  onStartEdit: (id: string) => void;
  onFinishEdit: () => void;
  onUpdateLayer: (id: string, patch: Partial<TextLayerData>) => void;
  onDeleteLayer: (id: string) => void;
  onAddLayer: (x: number, y: number) => void;
};

export const MemeCanvas = ({
  imageUrl,
  layers,
  editingLayerId,
  onStartEdit,
  onFinishEdit,
  onUpdateLayer,
  onDeleteLayer,
  onAddLayer,
}: Props) => {
  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ignore double-clicks that land on a text layer
    if ((e.target as HTMLElement).closest('[data-text-layer]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onAddLayer(x, y);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Clicking the canvas background while a layer is editing blurs via onBlur,
    // but we also finish edit here to be safe
    if (!(e.target as HTMLElement).closest('[data-text-layer]')) {
      onFinishEdit();
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden cursor-crosshair"
      onDoubleClick={handleDoubleClick}
      onClick={handleClick}
    >
      <img
        src={imageUrl}
        alt="Meme base"
        className="w-full h-auto block"
        draggable={false}
      />
      {layers.map((layer) => (
        <TextLayer
          key={layer.id}
          layer={layer}
          isEditing={editingLayerId === layer.id}
          onStartEdit={() => onStartEdit(layer.id)}
          onFinishEdit={onFinishEdit}
          onUpdate={(patch) => onUpdateLayer(layer.id, patch)}
          onDelete={() => onDeleteLayer(layer.id)}
        />
      ))}
    </div>
  );
};
