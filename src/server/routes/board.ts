import { Hono } from 'hono';
import { redis } from '@devvit/web/server';
import type {
  DailyWinnerResponse,
  DailyLeaderboardResponse,
  WeeklyLeaderboardResponse,
  WeeklyWinnerResponse,
  MemeBoardResponse,
} from '../../shared/api';
import {
  getTodayDateUTC,
  getMsUntilNextMidnightUTC,
  getMostRecentDailyWinner,
  getPostMeta,
  getWeeklyState,
  getMediaData,
  getRedditScore,
} from '../lib/competition';

type ErrorResponse = { status: 'error'; message: string };
type VideoRecord = { data: string; title: string; thumbnail: string | null };

export const board = new Hono();

board.get('/daily-winner', async (c) => {
  try {
    const msUntilNext = getMsUntilNextMidnightUTC();
    const result = await getMostRecentDailyWinner();

    if (!result) {
      return c.json<DailyWinnerResponse>({ type: 'daily-winner', phase: 'no-winner', msUntilNext });
    }

    const { postId, date } = result;
    const meta = await getPostMeta(postId);
    if (!meta) {
      return c.json<DailyWinnerResponse>({ type: 'daily-winner', phase: 'no-winner', msUntilNext });
    }

    const [mediaData, score] = await Promise.all([
      getMediaData(postId, meta.contentType),
      getRedditScore(postId),
    ]);

    if (!mediaData) {
      return c.json<DailyWinnerResponse>({ type: 'daily-winner', phase: 'no-winner', msUntilNext });
    }

    let thumbnailData: string | null = null;
    if (meta.contentType === 'video') {
      const raw = await redis.get(`video:${postId}`);
      if (raw) thumbnailData = (JSON.parse(raw) as VideoRecord).thumbnail;
    }

    return c.json<DailyWinnerResponse>({
      type: 'daily-winner',
      phase: 'has-winner',
      entry: {
        postId,
        title: meta.title,
        authorUsername: meta.authorUsername,
        contentType: meta.contentType,
        mediaData,
        thumbnailData,
        score,
        date,
      },
      msUntilNext,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.get('/daily-leaderboard', async (c) => {
  try {
    const today = getTodayDateUTC();
    const msUntilNext = getMsUntilNextMidnightUTC();

    const members = await redis.zRange(`daily:posts:${today}`, 0, -1, { by: 'rank' });

    const rows = await Promise.all(
      members.map(async ({ member: postId }) => {
        const [meta, score] = await Promise.all([
          getPostMeta(postId),
          getRedditScore(postId),
        ]);
        if (!meta) return null;
        return { postId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, score };
      })
    );

    const valid = (rows.filter(Boolean) as NonNullable<typeof rows[number]>[])
      .sort((a, b) => b.score - a.score)
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return c.json<DailyLeaderboardResponse>({ type: 'daily-leaderboard', date: today, msUntilNext, entries: valid });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.get('/weekly-leaderboard', async (c) => {
  try {
    const { round, phase, candidateIds, startMs, endMs, winnerId } = await getWeeklyState();

    const rows = await Promise.all(
      candidateIds.map(async (postId) => {
        const [meta, score] = await Promise.all([
          getPostMeta(postId),
          getRedditScore(postId),
        ]);
        if (!meta) return null;
        return { postId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, score };
      })
    );

    const candidates = (rows.filter(Boolean) as NonNullable<typeof rows[number]>[]);
    if (phase !== 'collecting') {
      candidates.sort((a, b) => b.score - a.score);
    }

    return c.json<WeeklyLeaderboardResponse>({ type: 'weekly-leaderboard', round, phase, candidates, startMs, endMs, winnerId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.get('/weekly-winner', async (c) => {
  try {
    const { round, phase, candidateIds, endMs, winnerId } = await getWeeklyState();

    if (phase !== 'ended' || !winnerId) {
      return c.json<WeeklyWinnerResponse>({ type: 'weekly-winner', phase: phase as 'collecting' | 'active', round, candidateCount: candidateIds.length, endMs });
    }

    const meta = await getPostMeta(winnerId);
    if (!meta) {
      return c.json<WeeklyWinnerResponse>({ type: 'weekly-winner', phase: 'ended', round, entry: null });
    }

    const [mediaData, score] = await Promise.all([
      getMediaData(winnerId, meta.contentType),
      getRedditScore(winnerId),
    ]);

    if (!mediaData) {
      return c.json<WeeklyWinnerResponse>({ type: 'weekly-winner', phase: 'ended', round, entry: null });
    }

    let thumbnailData: string | null = null;
    if (meta.contentType === 'video') {
      const raw = await redis.get(`video:${winnerId}`);
      if (raw) thumbnailData = (JSON.parse(raw) as VideoRecord).thumbnail;
    }

    return c.json<WeeklyWinnerResponse>({
      type: 'weekly-winner',
      phase: 'ended',
      round,
      entry: { postId: winnerId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, mediaData, thumbnailData, score },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.get('/meme-board', async (c) => {
  try {
    const page = parseInt(c.req.query('page') ?? '0');
    const pageSize = 20;
    const offset = page * pageSize;

    const total = await redis.zCard('posts:all');
    const members = await redis.zRange('posts:all', offset, offset + pageSize - 1, { by: 'rank', reverse: true });

    const rows = await Promise.all(
      members.map(async ({ member: postId }) => {
        const meta = await getPostMeta(postId);
        if (!meta) return null;
        return { postId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, createdAt: meta.createdAt };
      })
    );

    const entries = rows.filter(Boolean) as NonNullable<typeof rows[number]>[];
    return c.json<MemeBoardResponse>({ type: 'meme-board', entries, total, page });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

