import type { TextLayerData } from '@/hooks/useMemeEditor';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

type Props = {
  layer: TextLayerData;
  onUpdate: (patch: Partial<TextLayerData>) => void;
  onDelete: () => void;
  onToggleLock: () => void;
};

export const TextLayerControls = ({ layer, onUpdate, onDelete, onToggleLock }: Props) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <input
        className="flex-1 min-w-0 bg-transparent border-b border-gray-300 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:outline-none"
        value={layer.text}
        onChange={(e) => onUpdate({ text: e.target.value })}
        placeholder="Text"
      />
      <div className="flex items-center gap-2 w-36 shrink-0">
        <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">Size</span>
        <Slider
          min={14}
          max={48}
          step={1}
          value={[layer.fontSize]}
          onValueChange={(values) => {
            const v = values[0];
            if (v !== undefined) onUpdate({ fontSize: v });
          }}
          className="flex-1"
        />
      </div>
      <Button variant="ghost" size="sm" onClick={onToggleLock} className="text-xs shrink-0">
        {layer.locked ? 'Unlock' : 'Lock'}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-red-500 hover:text-red-700 text-xs shrink-0"
      >
        Delete
      </Button>
    </div>
  );
};
