import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import { storePostMeta, getRedditScore } from '../lib/competition';
import type {
  InitResponse,
  PostMemeRequest,
  PostMemeResponse,
  PostVideoRequest,
  PostVideoResponse,
  PostGifRequest,
  PostGifResponse,
  CreateMemePostResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

type VideoRecord = { data: string; title: string; thumbnail: string | null };
type GifRecord = { data: string; title: string };

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
      const score = await getRedditScore(postId);
      return c.json<InitResponse>({
        type: 'init',
        postId,
        username: resolvedUsername,
        mode: 'viewer',
        contentType: 'image',
        imageData,
        score,
      });
    }

    const videoRaw = await redis.get(`video:${postId}`);
    if (videoRaw) {
      const { data: videoData, title, thumbnail: thumbnailData } = JSON.parse(videoRaw) as VideoRecord;
      const score = await getRedditScore(postId);
      return c.json<InitResponse>({
        type: 'init',
        postId,
        username: resolvedUsername,
        mode: 'viewer',
        contentType: 'video',
        videoData,
        thumbnailData: thumbnailData ?? null,
        title,
        score,
      });
    }

    const gifRaw = await redis.get(`gif:${postId}`);
    if (gifRaw) {
      const { data: gifData, title } = JSON.parse(gifRaw) as GifRecord;
      const score = await getRedditScore(postId);
      return c.json<InitResponse>({
        type: 'init',
        postId,
        username: resolvedUsername,
        mode: 'viewer',
        contentType: 'gif',
        gifData,
        title,
        score,
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

  if (!postId || !subredditName) {
    return c.json<ErrorResponse>({ status: 'error', message: 'context missing postId or subredditName' }, 400);
  }

  try {
    const { imageData, title } = await c.req.json<PostMemeRequest>();
    const [newPost, authorUsername] = await Promise.all([
      reddit.submitCustomPost({ title }),
      reddit.getCurrentUsername(),
    ]);
    await Promise.all([
      redis.set(`meme:${newPost.id}`, imageData),
      storePostMeta(newPost.id, authorUsername ?? 'anonymous', title, 'image'),
    ]);

    return c.json<PostMemeResponse>({
      type: 'post-meme',
      postUrl: `https://reddit.com/r/${subredditName}/comments/${newPost.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 400);
  }
});

api.post('/post-video', async (c) => {
  const { postId, subredditName } = context;

  if (!postId || !subredditName) {
    return c.json<ErrorResponse>({ status: 'error', message: 'context missing postId or subredditName' }, 400);
  }

  try {
    const { videoData, thumbnailData, title } = await c.req.json<PostVideoRequest>();
    const [newPost, authorUsername] = await Promise.all([
      reddit.submitCustomPost({ title }),
      reddit.getCurrentUsername(),
    ]);
    const record: VideoRecord = { data: videoData, title, thumbnail: thumbnailData };
    await Promise.all([
      redis.set(`video:${newPost.id}`, JSON.stringify(record)),
      storePostMeta(newPost.id, authorUsername ?? 'anonymous', title, 'video'),
    ]);

    return c.json<PostVideoResponse>({
      type: 'post-video',
      postUrl: `https://reddit.com/r/${subredditName}/comments/${newPost.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 400);
  }
});

api.post('/post-gif', async (c) => {
  const { postId, subredditName } = context;

  if (!postId || !subredditName) {
    return c.json<ErrorResponse>({ status: 'error', message: 'context missing postId or subredditName' }, 400);
  }

  try {
    const { gifData, title } = await c.req.json<PostGifRequest>();
    const [newPost, authorUsername] = await Promise.all([
      reddit.submitCustomPost({ title }),
      reddit.getCurrentUsername(),
    ]);
    const record: GifRecord = { data: gifData, title };
    await Promise.all([
      redis.set(`gif:${newPost.id}`, JSON.stringify(record)),
      storePostMeta(newPost.id, authorUsername ?? 'anonymous', title, 'gif'),
    ]);

    return c.json<PostGifResponse>({
      type: 'post-gif',
      postUrl: `https://reddit.com/r/${subredditName}/comments/${newPost.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 400);
  }
});

api.post('/create-meme-post', async (c) => {
  const { subredditName } = context;

  if (!subredditName) {
    return c.json<ErrorResponse>({ status: 'error', message: 'subredditName is required' }, 400);
  }

  try {
    const newPost = await reddit.submitCustomPost({ title: 'Cook the Meme 🔥' });

    return c.json<CreateMemePostResponse>({
      type: 'create-meme-post',
      postUrl: `https://reddit.com/r/${subredditName}/comments/${newPost.id}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 400);
  }
});
