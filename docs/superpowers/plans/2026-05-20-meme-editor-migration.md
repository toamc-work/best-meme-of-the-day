# Meme Editor Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder counter in `game.tsx` with a fully functional meme editor that lets users upload an image, add draggable text layers, and post the result as a new Reddit post.

**Architecture:** `useMemeEditor` owns all state and the canvas export/submit logic. Five focused components (`ImageUpload`, `TextLayer`, `MemeCanvas`, `TextLayerControls`, `MemeEditor`) compose the editor view; `MemeViewer` handles read-only display. `game.tsx` queries `/api/init` on load and renders the editor or viewer depending on whether a meme is already stored in Redis for the post.

**Tech Stack:** React 19, TypeScript (strict), Tailwind CSS 4, shadcn/ui, Hono, Devvit Web API (`@devvit/web/client`, `@devvit/web/server`)

---

## File Map

| Action | Path |
|---|---|
| Create | `src/client/lib/utils.ts` |
| Create | `src/client/hooks/use-mobile.tsx` |
| Create | `src/client/components/ui/` (copied from frontend) |
| Create | `src/client/hooks/useMemeEditor.ts` |
| Create | `src/client/components/meme/ImageUpload.tsx` |
| Create | `src/client/components/meme/TextLayer.tsx` |
| Create | `src/client/components/meme/MemeCanvas.tsx` |
| Create | `src/client/components/meme/TextLayerControls.tsx` |
| Create | `src/client/components/meme/MemeEditor.tsx` |
| Create | `src/client/components/meme/MemeViewer.tsx` |
| Modify | `src/client/index.css` |
| Modify | `src/client/game.tsx` |
| Modify | `src/shared/api.ts` |
| Modify | `src/server/routes/api.ts` |
| Modify | `tools/tsconfig.client.json` |
| Modify | `vite.config.ts` |
| Modify | `package.json` |
| Delete | `src/client/hooks/useCounter.ts` |

---

## Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime packages**

```bash
cd "F:\toam\code\portfolio\memeoftheday\meme-of-the-day"
npm install class-variance-authority clsx tailwind-merge lucide-react \
  @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-slider \
  @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-toast @radix-ui/react-accordion \
  @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar \
  @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu \
  @radix-ui/react-hover-card @radix-ui/react-menubar @radix-ui/react-navigation-menu \
  @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator \
  @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-tooltip \
  cmdk vaul embla-carousel-react react-day-picker date-fns \
  react-resizable-panels sonner input-otp
```

Expected: packages added to `node_modules/`, `package.json` updated.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install shadcn/ui and radix-ui dependencies"
```

---

## Task 2: Configure `@` path alias

**Files:**
- Modify: `tools/tsconfig.client.json`
- Modify: `vite.config.ts`

- [ ] **Step 1: Add paths to `tools/tsconfig.client.json`**

Replace the file content with:

```json
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "../dist/types/client",
    "tsBuildInfoFile": "../dist/types/client/tsconfig.tsbuildinfo",
    "customConditions": ["browser"],
    "rootDir": "../src/client",
    "paths": {
      "@/*": ["../src/client/*"]
    }
  },
  "include": ["../src/client/**/*"],
  "exclude": [],
  "references": [
    {
      "path": "./tsconfig.shared.json"
    }
  ]
}
```

- [ ] **Step 2: Add alias to `vite.config.ts`**

Replace the file content with:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { devvit } from '@devvit/start/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwind(), devvit()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/client'),
    },
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add tools/tsconfig.client.json vite.config.ts
git commit -m "chore: add @ path alias for src/client"
```

---

## Task 3: Copy shadcn/ui library and create supporting files

**Files:**
- Create: `src/client/components/ui/` (all files)
- Create: `src/client/lib/utils.ts`
- Create: `src/client/hooks/use-mobile.tsx`
- Modify: `src/client/index.css`

- [ ] **Step 1: Copy the full UI component library from the frontend**

```powershell
Copy-Item -Recurse -Force "F:\toam\code\portfolio\memeoftheday\frontend\src\components\ui" "F:\toam\code\portfolio\memeoftheday\meme-of-the-day\src\client\components\"
```

Expected: `src/client/components/ui/` contains ~60 `.tsx` files (button.tsx, slider.tsx, input.tsx, etc.).

- [ ] **Step 2: Create `src/client/lib/utils.ts`**

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

- [ ] **Step 3: Create `src/client/hooks/use-mobile.tsx`**

```tsx
import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
};
```

- [ ] **Step 4: Update `src/client/index.css` with shadcn CSS variables**

Replace the file content with:

```css
@import 'tailwindcss';

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}
```

- [ ] **Step 5: Run type-check to surface any import issues**

```bash
npm run type-check 2>&1 | head -50
```

Expected: Errors only about missing files we haven't created yet (useMemeEditor, meme components). If there are errors about missing packages (e.g. `Cannot find module 'cmdk'`), run `npm install <package-name>` to fix them before continuing.

- [ ] **Step 6: Commit**

```bash
git add src/client/components/ui src/client/lib/utils.ts src/client/hooks/use-mobile.tsx src/client/index.css
git commit -m "feat: add shadcn/ui component library and path alias setup"
```

---

## Task 4: Update shared API types

**Files:**
- Modify: `src/shared/api.ts`

- [ ] **Step 1: Replace `src/shared/api.ts` with updated types**

```ts
export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
} & ({ mode: 'editor' } | { mode: 'viewer'; imageData: string });

export type PostMemeRequest = {
  imageData: string;
  title: string;
};

export type PostMemeResponse = {
  type: 'post-meme';
  postUrl: string;
};
```

- [ ] **Step 2: Verify type-check passes for shared**

```bash
npm run type-check 2>&1 | grep "shared"
```

Expected: No errors mentioning `src/shared/api.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/shared/api.ts
git commit -m "feat: update shared API types for meme editor"
```

---

## Task 5: Update `/api/init` server endpoint

**Files:**
- Modify: `src/server/routes/api.ts`

- [ ] **Step 1: Replace `src/server/routes/api.ts` with updated content**

```ts
import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type { InitResponse, PostMemeRequest, PostMemeResponse } from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }

  try {
    const [imageData, username] = await Promise.all([
      redis.get(`meme:${postId}`),
      reddit.getCurrentUsername(),
    ]);

    const resolvedUsername = username ?? 'anonymous';

    if (imageData) {
      return c.json<InitResponse>({
        type: 'init',
        postId,
        username: resolvedUsername,
        mode: 'viewer',
        imageData,
      });
    }

    return c.json<InitResponse>({
      type: 'init',
      postId,
      username: resolvedUsername,
      mode: 'editor',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 400);
  }
});

api.post('/post-meme', async (c) => {
  const { postId, subredditName } = context;

  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }

  try {
    const { imageData, title } = await c.req.json<PostMemeRequest>();
    const newPost = await reddit.submitCustomPost({ title });
    await redis.set(`meme:${newPost.id}`, imageData);

    return c.json<PostMemeResponse>({
      type: 'post-meme',
      postUrl: `https://reddit.com/r/${subredditName}/comments/${newPost.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 400);
  }
});
```

- [ ] **Step 2: Run type-check for server**

```bash
npm run type-check 2>&1 | grep "server"
```

Expected: No errors for `src/server/`.

- [ ] **Step 3: Commit**

```bash
git add src/server/routes/api.ts
git commit -m "feat: update /api/init for dual-mode, add /api/post-meme endpoint"
```

---

## Task 6: Create `useMemeEditor` hook

**Files:**
- Create: `src/client/hooks/useMemeEditor.ts`

- [ ] **Step 1: Create `src/client/hooks/useMemeEditor.ts`**

```ts
import { useCallback, useState } from 'react';
import { navigateTo, showToast } from '@devvit/web/client';
import type { PostMemeRequest, PostMemeResponse } from '../../shared/api';

export type TextLayerData = {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  locked: boolean;
};

type MemeEditorState = {
  image: File | null;
  imageUrl: string | null;
  layers: TextLayerData[];
  selectedLayerId: string | null;
  submitting: boolean;
};

export const useMemeEditor = () => {
  const [state, setState] = useState<MemeEditorState>({
    image: null,
    imageUrl: null,
    layers: [],
    selectedLayerId: null,
    submitting: false,
  });

  const setImage = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    setState((prev) => {
      if (prev.imageUrl) URL.revokeObjectURL(prev.imageUrl);
      return { ...prev, image: file, imageUrl: url };
    });
  }, []);

  const addLayer = useCallback(() => {
    const newLayer: TextLayerData = {
      id: crypto.randomUUID(),
      text: 'Text',
      x: 50,
      y: 50,
      fontSize: 24,
      locked: false,
    };
    setState((prev) => ({
      ...prev,
      layers: [...prev.layers, newLayer],
      selectedLayerId: newLayer.id,
    }));
  }, []);

  const updateLayer = useCallback((id: string, patch: Partial<TextLayerData>) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    }));
  }, []);

  const deleteLayer = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.filter((l) => l.id !== id),
      selectedLayerId: prev.selectedLayerId === id ? null : prev.selectedLayerId,
    }));
  }, []);

  const toggleLock = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      layers: prev.layers.map((l) =>
        l.id === id ? { ...l, locked: !l.locked } : l
      ),
      selectedLayerId: prev.selectedLayerId === id ? null : prev.selectedLayerId,
    }));
  }, []);

  const selectLayer = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedLayerId: id }));
  }, []);

  const exportAndSubmit = useCallback(
    async (title: string) => {
      const { imageUrl, layers } = state;
      if (!imageUrl) return;

      setState((prev) => ({ ...prev, submitting: true }));

      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = imageUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');

        ctx.drawImage(img, 0, 0);

        for (const layer of layers) {
          const scaledSize = layer.fontSize * (img.naturalWidth / 500);
          ctx.font = `bold ${scaledSize}px Impact, Arial`;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.strokeStyle = 'black';
          ctx.lineWidth = 2;
          ctx.fillStyle = 'white';
          const x = (layer.x / 100) * img.naturalWidth;
          const y = (layer.y / 100) * img.naturalHeight;
          ctx.strokeText(layer.text, x, y);
          ctx.fillText(layer.text, x, y);
        }

        const imageData = canvas.toDataURL('image/png');

        const res = await fetch('/api/post-meme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageData, title } satisfies PostMemeRequest),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: PostMemeResponse = await res.json();
        navigateTo(data.postUrl);
      } catch (err) {
        console.error('Failed to post meme', err);
        showToast('Failed to post meme');
      } finally {
        setState((prev) => ({ ...prev, submitting: false }));
      }
    },
    [state]
  );

  return {
    ...state,
    setImage,
    addLayer,
    updateLayer,
    deleteLayer,
    toggleLock,
    selectLayer,
    exportAndSubmit,
  } as const;
};
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check 2>&1 | grep "useMemeEditor"
```

Expected: No errors for `src/client/hooks/useMemeEditor.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/client/hooks/useMemeEditor.ts
git commit -m "feat: create useMemeEditor hook"
```

---

## Task 7: Create `ImageUpload` component

**Files:**
- Create: `src/client/components/meme/ImageUpload.tsx`

- [ ] **Step 1: Create `src/client/components/meme/ImageUpload.tsx`**

```tsx
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
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check 2>&1 | grep "ImageUpload"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/client/components/meme/ImageUpload.tsx
git commit -m "feat: create ImageUpload component"
```

---

## Task 8: Create `TextLayer` component

**Files:**
- Create: `src/client/components/meme/TextLayer.tsx`

- [ ] **Step 1: Create `src/client/components/meme/TextLayer.tsx`**

```tsx
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
    window.addEventListener('touchmove', move, { passive: true });
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
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check 2>&1 | grep "TextLayer"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/client/components/meme/TextLayer.tsx
git commit -m "feat: create draggable TextLayer component"
```

---

## Task 9: Create `MemeCanvas` component

**Files:**
- Create: `src/client/components/meme/MemeCanvas.tsx`

- [ ] **Step 1: Create `src/client/components/meme/MemeCanvas.tsx`**

```tsx
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
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check 2>&1 | grep "MemeCanvas"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/client/components/meme/MemeCanvas.tsx
git commit -m "feat: create MemeCanvas component"
```

---

## Task 10: Create `TextLayerControls` component

**Files:**
- Create: `src/client/components/meme/TextLayerControls.tsx`

- [ ] **Step 1: Create `src/client/components/meme/TextLayerControls.tsx`**

```tsx
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
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check 2>&1 | grep "TextLayerControls"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/client/components/meme/TextLayerControls.tsx
git commit -m "feat: create TextLayerControls component"
```

---

## Task 11: Create `MemeEditor` component

**Files:**
- Create: `src/client/components/meme/MemeEditor.tsx`

- [ ] **Step 1: Create `src/client/components/meme/MemeEditor.tsx`**

```tsx
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
```

- [ ] **Step 2: Run type-check**

```bash
npm run type-check 2>&1 | grep "MemeEditor"
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/client/components/meme/MemeEditor.tsx
git commit -m "feat: create MemeEditor coordinator component"
```

---

## Task 12: Create `MemeViewer` component

**Files:**
- Create: `src/client/components/meme/MemeViewer.tsx`

- [ ] **Step 1: Create `src/client/components/meme/MemeViewer.tsx`**

```tsx
type Props = {
  imageData: string;
};

export const MemeViewer = ({ imageData }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 p-4">
      <img
        src={imageData}
        alt="Meme"
        className="w-full max-w-lg rounded-lg shadow-lg"
      />
    </div>
  );
};
```

- [ ] **Step 2: Commit**

```bash
git add src/client/components/meme/MemeViewer.tsx
git commit -m "feat: create MemeViewer component"
```

---

## Task 13: Update `game.tsx`

**Files:**
- Modify: `src/client/game.tsx`

- [ ] **Step 1: Replace `src/client/game.tsx` content**

```tsx
import './index.css';

import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemeEditor } from './components/meme/MemeEditor';
import { MemeViewer } from './components/meme/MemeViewer';
import type { InitResponse } from '../shared/api';

const App = () => {
  const [initData, setInitData] = useState<InitResponse | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch('/api/init');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: InitResponse = await res.json();
        setInitData(data);
      } catch (err) {
        console.error('Failed to init', err);
      }
    };
    void init();
  }, []);

  if (!initData) return null;
  if (initData.mode === 'viewer') return <MemeViewer imageData={initData.imageData} />;
  return <MemeEditor />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 2: Run full type-check**

```bash
npm run type-check
```

Expected: Clean pass (zero errors). If any errors remain, fix them before continuing.

- [ ] **Step 3: Commit**

```bash
git add src/client/game.tsx
git commit -m "feat: wire MemeEditor/MemeViewer into game.tsx"
```

---

## Task 14: Clean up counter code

**Files:**
- Delete: `src/client/hooks/useCounter.ts`

- [ ] **Step 1: Delete `useCounter.ts`**

```bash
rm "F:\toam\code\portfolio\memeoftheday\meme-of-the-day\src\client\hooks\useCounter.ts"
```

- [ ] **Step 2: Run type-check to confirm nothing references it**

```bash
npm run type-check
```

Expected: Clean pass.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: Clean pass. If any lint errors appear, fix them before continuing.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove counter placeholder code"
```

---

## Task 15: Build verification

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Build succeeds with output in `dist/`. If it fails, fix any remaining issues before marking complete.

- [ ] **Step 2: Commit any build fixes if needed, then tag as complete**

```bash
git add -A
git commit -m "chore: resolve build issues post-migration"
```

(Skip this commit if the build passed cleanly in Step 1.)
