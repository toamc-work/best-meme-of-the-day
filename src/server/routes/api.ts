import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  InitResponse,
  PostMemeRequest,
  PostMemeResponse,
  VoteRequest,
  VoteResponse,
  CreateMemePostResponse,
} from '../../shared/api';

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
      const votesHash = await redis.hGetAll(`meme:votes:${postId}`);
      let likes = 0;
      let dislikes = 0;
      let userVote: 'like' | 'dislike' | null = null;

      for (const [user, vote] of Object.entries(votesHash ?? {})) {
        if (vote === 'like') likes++;
        else if (vote === 'dislike') dislikes++;
        if (user === resolvedUsername) userVote = vote as 'like' | 'dislike';
      }

      return c.json<InitResponse>({
        type: 'init',
        postId,
        username: resolvedUsername,
        mode: 'viewer',
        imageData,
        likes,
        dislikes,
        userVote,
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

api.post('/vote', async (c) => {
  const { postId } = context;

  if (!postId) {
    return c.json<ErrorResponse>({ status: 'error', message: 'postId is required' }, 400);
  }

  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    const { action } = await c.req.json<VoteRequest>();
    const voteKey = `meme:votes:${postId}`;

    const currentVote = await redis.hGet(voteKey, username);

    if (currentVote === action) {
      await redis.hDel(voteKey, [username]);
    } else {
      await redis.hSet(voteKey, { [username]: action });
    }

    const votesHash = await redis.hGetAll(voteKey);
    let likes = 0;
    let dislikes = 0;
    let userVote: 'like' | 'dislike' | null = null;

    for (const [user, vote] of Object.entries(votesHash ?? {})) {
      if (vote === 'like') likes++;
      else if (vote === 'dislike') dislikes++;
      if (user === username) userVote = vote as 'like' | 'dislike';
    }

    return c.json<VoteResponse>({ type: 'vote', likes, dislikes, userVote });
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
