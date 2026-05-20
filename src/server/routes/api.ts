import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  InitResponse,
  PostMemeRequest,
  PostMemeResponse,
  PostVideoRequest,
  PostVideoResponse,
  VoteRequest,
  VoteResponse,
  CreateMemePostResponse,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

type VideoRecord = { data: string; title: string };

async function getVoteCounts(
  postId: string,
  username: string
): Promise<{ likes: number; dislikes: number; userVote: 'like' | 'dislike' | null }> {
  const votesHash = await redis.hGetAll(`meme:votes:${postId}`);
  let likes = 0;
  let dislikes = 0;
  let userVote: 'like' | 'dislike' | null = null;

  for (const [user, vote] of Object.entries(votesHash ?? {})) {
    if (vote === 'like') likes++;
    else if (vote === 'dislike') dislikes++;
    if (user === username) userVote = vote as 'like' | 'dislike';
  }

  return { likes, dislikes, userVote };
}

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
      const votes = await getVoteCounts(postId, resolvedUsername);
      return c.json<InitResponse>({
        type: 'init',
        postId,
        username: resolvedUsername,
        mode: 'viewer',
        contentType: 'image',
        imageData,
        ...votes,
      });
    }

    const videoRaw = await redis.get(`video:${postId}`);
    if (videoRaw) {
      const { data: videoData, title } = JSON.parse(videoRaw) as VideoRecord;
      const votes = await getVoteCounts(postId, resolvedUsername);
      return c.json<InitResponse>({
        type: 'init',
        postId,
        username: resolvedUsername,
        mode: 'viewer',
        contentType: 'video',
        videoData,
        title,
        ...votes,
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

api.post('/post-video', async (c) => {
  const { postId, subredditName } = context;

  if (!postId || !subredditName) {
    return c.json<ErrorResponse>({ status: 'error', message: 'context missing postId or subredditName' }, 400);
  }

  try {
    const { videoData, title } = await c.req.json<PostVideoRequest>();
    const newPost = await reddit.submitCustomPost({ title });
    const record: VideoRecord = { data: videoData, title };
    await redis.set(`video:${newPost.id}`, JSON.stringify(record));

    return c.json<PostVideoResponse>({
      type: 'post-video',
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

    const votes = await getVoteCounts(postId, username);
    return c.json<VoteResponse>({ type: 'vote', ...votes });
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
