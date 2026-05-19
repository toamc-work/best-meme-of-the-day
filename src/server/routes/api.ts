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
