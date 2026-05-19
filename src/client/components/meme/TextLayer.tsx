import { useRef } from 'react';
import { cn } from '@/lib/utils';
import type { TextLayerData } from '@/hooks/useMemeEditor';

type Props = {
  layer: TextLayerData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<TextLayerData>) => void;
};

export const TextLayer = ({ layer, isSelected, onSelect, onUpdate }: Props) => {
  const divRef = useRef<HTMLDivElement>(null);

  const startDrag = (startClientX: number, startClientY: number) => {
    if (layer.locked) return;
    const parentRect = divRef.current?.parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    const startX = layer.x;
    const startY = layer.y;

    const move = (e: MouseEvent | TouchEvent) => {
      let cx: number;
      let cy: number;
      if ('touches' in e) {
        const touch = e.touches[0];
        if (!touch) return;
        cx = touch.clientX;
        cy = touch.clientY;
      } else {
        cx = e.clientX;
        cy = e.clientY;
      }
      const dx = ((cx - startClientX) / parentRect.width) * 100;
      const dy = ((cy - startClientY) / parentRect.height) * 100;
      onUpdate({
        x: Math.max(0, Math.min(100, startX + dx)),
        y: Math.max(0, Math.min(100, startY + dy)),
      });
    };

    const end = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchend', end);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('touchmove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchend', end);
  };

  return (
    <div
      ref={divRef}
      className={cn(
        'absolute select-none',
        layer.locked ? 'cursor-default pointer-events-none' : 'cursor-move',
        isSelected && 'outline outline-2 outline-blue-400 outline-offset-2'
      )}
      style={{
        left: `${layer.x}%`,
        top: `${layer.y}%`,
        transform: 'translate(-50%, -50%)',
        fontSize: `${layer.fontSize}px`,
        fontWeight: 'bold',
        color: 'white',
        textShadow:
          '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
        whiteSpace: 'nowrap',
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
        startDrag(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        e.stopPropagation();
        onSelect();
        const touch = e.touches[0];
        if (touch) startDrag(touch.clientX, touch.clientY);
      }}
    >
      {layer.text}
    </div>
  );
};
