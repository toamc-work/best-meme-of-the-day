import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { TextLayerData } from '@/hooks/useMemeEditor';

const TEXT_STYLE = {
  fontFamily: 'Impact, Arial, sans-serif',
  fontWeight: 'bold',
  color: 'white',
  textShadow:
    '2px 2px 4px rgba(0,0,0,0.8), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
  whiteSpace: 'pre' as const,
} as const;

type Props = {
  layer: TextLayerData;
  isEditing: boolean;
  onStartEdit: () => void;
  onFinishEdit: () => void;
  onUpdate: (patch: Partial<TextLayerData>) => void;
  onDelete: () => void;
};

export const TextLayer = ({
  layer,
  isEditing,
  onStartEdit,
  onFinishEdit,
  onUpdate,
  onDelete,
}: Props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef({ moved: false, startX: 0, startY: 0, layerX: 0, layerY: 0 });

  // keep hover open long enough to actually click the delete button
  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    setIsHovered(true);
  };
  const handleMouseLeave = () => {
    hoverTimerRef.current = setTimeout(() => setIsHovered(false), 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, []);

  const syncSize = useCallback((el: HTMLTextAreaElement) => {
    const measure = measureRef.current;
    if (measure) {
      measure.textContent = el.value || 'M';
      el.style.width = `${measure.offsetWidth + 16}px`;
    }
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  // re-measure when font size changes while editing
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      syncSize(textareaRef.current);
    }
  }, [layer.fontSize, isEditing, syncSize]);

  // auto-focus and select all when entering edit mode
  useEffect(() => {
    if (!isEditing) return;
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    el.select();
    syncSize(el);
  }, [isEditing, syncSize]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    syncSize(e.target);
    onUpdate({ text: e.target.value });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onFinishEdit();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || layer.locked) return;
    e.stopPropagation();

    const parentRect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    dragRef.current = {
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      layerX: layer.x,
      layerY: layer.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
      onUpdate({
        x: Math.max(0, Math.min(100, dragRef.current.layerX + (dx / parentRect.width) * 100)),
        y: Math.max(0, Math.min(100, dragRef.current.layerY + (dy / parentRect.height) * 100)),
      });
    };

    const handleMouseUp = () => {
      if (!dragRef.current.moved) onStartEdit();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEditing || layer.locked) return;
    e.stopPropagation();

    const touch = e.touches[0];
    if (!touch) return;
    const parentRect = (e.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
    if (!parentRect) return;

    dragRef.current = {
      moved: false,
      startX: touch.clientX,
      startY: touch.clientY,
      layerX: layer.x,
      layerY: layer.y,
    };

    const handleTouchMove = (ev: TouchEvent) => {
      const t = ev.touches[0];
      if (!t) return;
      const dx = t.clientX - dragRef.current.startX;
      const dy = t.clientY - dragRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
      onUpdate({
        x: Math.max(0, Math.min(100, dragRef.current.layerX + (dx / parentRect.width) * 100)),
        y: Math.max(0, Math.min(100, dragRef.current.layerY + (dy / parentRect.height) * 100)),
      });
    };

    const handleTouchEnd = () => {
      if (!dragRef.current.moved) onStartEdit();
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };

    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);
  };

  const positionStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${layer.x}%`,
    top: `${layer.y}%`,
    transform: 'translate(-50%, -50%)',
  };

  if (isEditing) {
    return (
      <div data-text-layer style={positionStyle}>
        <span
          ref={measureRef}
          aria-hidden
          style={{
            ...TEXT_STYLE,
            fontSize: `${layer.fontSize}px`,
            position: 'absolute',
            visibility: 'hidden',
            pointerEvents: 'none',
          }}
        />
        <textarea
          ref={textareaRef}
          value={layer.text}
          onChange={handleTextareaChange}
          onBlur={(e) => {
              // keep editing if focus moved to the font/delete controls
              const rel = e.relatedTarget as HTMLElement | null;
              if (rel?.closest?.('[data-text-controls]')) return;
              onFinishEdit();
            }}
          onKeyDown={handleTextareaKeyDown}
          rows={1}
          style={{
            ...TEXT_STYLE,
            fontSize: `${layer.fontSize}px`,
            background: 'transparent',
            border: 'none',
            outline: '1px dashed rgba(255,255,255,0.6)',
            resize: 'none',
            overflow: 'hidden',
            padding: '2px 4px',
            caretColor: 'white',
            minWidth: '60px',
            textAlign: 'center',
            display: 'block',
          }}
        />
      </div>
    );
  }

  return (
    <div
      data-text-layer
      style={positionStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div style={{ position: 'relative', display: 'inline-block' }}>
        {isHovered && (
          <button
            style={{
              position: 'absolute',
              top: -28,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#d93900',
              border: 'none',
              borderRadius: 4,
              padding: '3px 5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label="Delete text layer"
          >
            <Trash2 size={12} color="white" />
          </button>
        )}
        <span
          style={{
            ...TEXT_STYLE,
            fontSize: `${layer.fontSize}px`,
            cursor: layer.locked ? 'default' : 'move',
            userSelect: 'none',
            display: 'block',
            padding: '2px 4px',
          }}
        >
          {layer.text}
        </span>
      </div>
    </div>
  );
};
