# Meme Editor Migration: Frontend → Devvit Client

**Date:** 2026-05-20
**Scope:** Migrate the meme editor from `../frontend/src/pages/Index.tsx` into `src/client/` as a proper Devvit web app feature.

---

## Goal

Replace the placeholder counter app in `game.tsx` with a fully functional meme editor. Users upload an image, add draggable text layers, then post the result as a new Reddit post in the subreddit.

The game view operates in two modes determined at load time:
- **Editor mode** — no meme stored for this `postId` yet; shows the full editor UI
- **Viewer mode** — a meme image is stored in Redis for this `postId`; shows the finished meme read-only

---

## What Is Not Migrated

- Blog system (`src/pages/blog/`) — not relevant to Devvit
- Auth pages (`src/pages/AuthCallback.tsx`, `src/pages/AuthError.tsx`) — not relevant
- MetaGPT Web SDK integration (`src/lib/api.ts`) — not used by the meme editor
- `splash.tsx` — unchanged; still launches the game view

---

## File Structure

### New files

```
src/client/
  components/
    meme/
      MemeEditor.tsx         ← coordinator component (editor mode)
      MemeViewer.tsx         ← read-only meme display (viewer mode)
      ImageUpload.tsx        ← drag/drop + file input
      MemeCanvas.tsx         ← image + text layer display, holds canvas ref
      TextLayer.tsx          ← single draggable text overlay
      TextLayerControls.tsx  ← font size, lock, delete for selected layer
    ui/                      ← full shadcn/ui library (source files)
  hooks/
    useMemeEditor.ts         ← all meme state and actions
  lib/
    utils.ts                 ← cn() utility (clsx + tailwind-merge)
```

### Modified files

- `src/client/game.tsx` — renders `<MemeEditor />` or `<MemeViewer />` based on init mode
- `src/server/routes/api.ts` — adds `POST /api/post-meme` endpoint
- `src/shared/api.ts` — adds `PostMemeRequest` and `PostMemeResponse` types
- `package.json` — adds new dependencies (see Dependencies section)

### Deleted files

- `src/client/hooks/useCounter.ts` — superseded by `useMemeEditor`

---

## State & Data Flow

`useMemeEditor` owns all meme state, following the existing `useCounter` hook pattern.

### State shape

```ts
type TextLayerData = {
  id: string;
  text: string;
  x: number;       // percent of canvas width
  y: number;       // percent of canvas height
  fontSize: number; // 14–48
  locked: boolean;
};

type MemeEditorState = {
  image: File | null;
  imageUrl: string | null;   // object URL derived from image
  layers: TextLayerData[];
  selectedLayerId: string | null;
  submitting: boolean;
};
```

### Actions

| Action | Description |
|---|---|
| `setImage(file)` | Called by `ImageUpload` on drop or file select |
| `addLayer()` | Appends a new text layer at canvas center |
| `updateLayer(id, patch)` | Partial update to any layer field |
| `deleteLayer(id)` | Removes a layer; clears selection if selected |
| `toggleLock(id)` | Flips `locked` on a layer |
| `exportAndSubmit(title)` | Renders canvas → base64 → POST → navigate |

### Submit flow

1. User enters a post title and clicks "Post Meme"
2. `exportAndSubmit` renders the meme off-screen via `HTMLCanvasElement`:
   - Draws the base image
   - Draws each text layer (bold white, drop shadow) at its stored position
3. Calls `.toBlob()` → converts to base64 string
4. POSTs `{ imageData: string, title: string }` to `/api/post-meme`
5. Server calls `reddit.submitCustomPost({ title })` → gets back `newPost` with `newPost.id`
6. Server stores image under the **new** post's ID: `redis.set('meme:' + newPost.id, imageData)`
7. Server returns `{ type: 'post-meme', postUrl }`
8. On success: calls `navigateTo(postUrl)` from `@devvit/web/client`
9. On error: calls `showToast('Failed to post meme')` from `@devvit/web/client`

### Init response determines mode

`/api/init` checks for `meme:${postId}` in Redis:
- **Found** → returns `{ type: 'init', mode: 'viewer', imageData: string, username }`
- **Not found** → returns `{ type: 'init', mode: 'editor', username }`

`game.tsx` renders `<MemeViewer imageData={...} />` or `<MemeEditor />` accordingly.

### Devvit constraint: no native image posts

`reddit.submitCustomPost` creates an interactive Devvit post, not a native Reddit image post. The meme image is stored server-side (Redis) keyed by the new `postId` and rendered inside the post's expanded game view. This is the correct approach for Devvit apps.

---

## Component Responsibilities

### `MemeEditor`

Coordinator. Reads from `useMemeEditor`, renders:
- `<ImageUpload>` when no image is loaded
- `<MemeCanvas>` + `<TextLayerControls>` when image is loaded
- Title input and "Post Meme" button always visible once image is loaded
- "Add Text" button to call `addLayer()`

### `ImageUpload`

- Drag/drop zone with file input fallback
- Accepts PNG, JPG, GIF
- Shows dashed border with "Drop image or click to upload" prompt
- Calls `setImage(file)` on selection
- Disappears once an image is loaded

### `MemeCanvas`

- Renders `<img>` as base layer
- Maps `layers` to `<TextLayer>` components positioned absolutely on top
- Holds `canvasRef` for off-screen export (hidden `<canvas>` element)
- Sized to image natural aspect ratio, capped to viewport width
- Clicking the canvas background deselects the active layer

### `TextLayer`

- Absolutely positioned `<div>` over the canvas
- Handles `mousedown`/`touchstart` to begin drag; updates `x`/`y` via `updateLayer`
- Locked layers (`locked: true`) ignore all pointer events
- Selected layer shows a visible outline
- Text styled: bold white, drop shadow — matches frontend design

### `TextLayerControls`

- Shown below the canvas when a layer is selected
- Contains:
  - Font size slider (14–48px) using shadcn/ui `Slider`
  - Lock/unlock toggle using shadcn/ui `Toggle`
  - Delete button using shadcn/ui `Button`

---

## Server Endpoint

**`POST /api/post-meme`** added to `src/server/routes/api.ts`

Request:
```ts
type PostMemeRequest = {
  imageData: string;  // base64 PNG
  title: string;
};
```

Response:
```ts
type PostMemeResponse = {
  type: 'post-meme';
  postUrl: string;
};
```

Steps:
1. Validate `postId` exists in `context`
2. Call `reddit.submitCustomPost({ title })` → get back `newPost`
3. Store `imageData` under the new post's ID: `redis.set('meme:' + newPost.id, imageData)`
4. Return `{ type: 'post-meme', postUrl }`

The new post's `/api/init` finds `meme:${newPost.id}` in Redis and returns viewer-mode response.

---

## Dependencies

Add to `package.json`:

```
class-variance-authority
clsx
tailwind-merge
lucide-react
@radix-ui/react-slot
@radix-ui/react-label
@radix-ui/react-slider
@radix-ui/react-toggle
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-toast
```

Only Radix primitives actually referenced by used shadcn/ui components need to be installed. Unused components in `src/client/components/ui/` won't require their peer deps until consumed.

---

## What Does Not Change

- `devvit.json` — no new entrypoints or menu items needed
- `tsconfig` files — no changes
- `vite.config.ts` — no changes
- `splash.tsx` — unchanged
- `src/server/index.ts` — unchanged (routes already wired)
