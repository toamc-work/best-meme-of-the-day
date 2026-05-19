import type { TextLayerData } from '@/hooks/useMemeEditor';
import { TextLayer } from './TextLayer';

type Props = {
  imageUrl: string;
  layers: TextLayerData[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<TextLayerData>) => void;
};

export const MemeCanvas = ({
  imageUrl,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
}: Props) => {
  return (
    <div
      className="relative w-full max-w-lg mx-auto overflow-hidden rounded-lg cursor-default"
      onClick={() => onSelectLayer(null)}
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
          isSelected={selectedLayerId === layer.id}
          onSelect={() => onSelectLayer(layer.id)}
          onUpdate={(patch) => onUpdateLayer(layer.id, patch)}
        />
      ))}
    </div>
  );
};
