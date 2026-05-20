import { Hono } from 'hono';
import type { UiResponse } from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';

export const menu = new Hono();

menu.post('/post-create', async (c) => {
  try {
    const post = await reddit.submitCustomPost({ title: 'Cook the Meme 🔥' });
    return c.json<UiResponse>(
      { navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` },
      200
    );
  } catch (error) {
    console.error(`Error creating meme post: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to create post' }, 400);
  }
});

menu.post('/board-daily-winner', async (c) => {
  try {
    const post = await reddit.submitCustomPost({ title: '🏆 Daily Meme Winner', entry: 'daily-winner' });
    return c.json<UiResponse>(
      { navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` },
      200
    );
  } catch (error) {
    console.error(`Error creating daily winner board: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to create board' }, 400);
  }
});

menu.post('/board-daily-leaderboard', async (c) => {
  try {
    const post = await reddit.submitCustomPost({ title: '📊 Daily Meme Leaderboard', entry: 'daily-leaderboard' });
    return c.json<UiResponse>(
      { navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` },
      200
    );
  } catch (error) {
    console.error(`Error creating daily leaderboard board: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to create board' }, 400);
  }
});

menu.post('/board-weekly-leaderboard', async (c) => {
  try {
    const post = await reddit.submitCustomPost({ title: '🔥 Weekly Meme Battle', entry: 'weekly-leaderboard' });
    return c.json<UiResponse>(
      { navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` },
      200
    );
  } catch (error) {
    console.error(`Error creating weekly leaderboard board: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to create board' }, 400);
  }
});

menu.post('/board-weekly-winner', async (c) => {
  try {
    const post = await reddit.submitCustomPost({ title: '👑 Weekly Meme Champion', entry: 'weekly-winner' });
    return c.json<UiResponse>(
      { navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` },
      200
    );
  } catch (error) {
    console.error(`Error creating weekly winner board: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to create board' }, 400);
  }
});

menu.post('/board-meme-board', async (c) => {
  try {
    const post = await reddit.submitCustomPost({ title: '🎭 Meme Board', entry: 'meme-board' });
    return c.json<UiResponse>(
      { navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}` },
      200
    );
  } catch (error) {
    console.error(`Error creating meme board: ${error}`);
    return c.json<UiResponse>({ showToast: 'Failed to create board' }, 400);
  }
});
