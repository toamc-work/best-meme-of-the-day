import { Hono } from 'hono';
import { redis, reddit } from '@devvit/web/server';
import type {
  DailyWinnerResponse,
  DailyLeaderboardResponse,
  WeeklyLeaderboardResponse,
  WeeklyWinnerResponse,
  MemeBoardResponse,
  WeeklyVoteRequest,
  WeeklyVoteResponse,
} from '../../shared/api';
import {
  getTodayDateUTC,
  getMsUntilNextMidnightUTC,
  getMostRecentDailyWinner,
  getPostMeta,
  getVoteCountsFor,
  getWeeklyVotes,
  getWeeklyState,
  getMediaData,
} from '../lib/competition';

type ErrorResponse = { status: 'error'; message: string };
type VideoRecord = { data: string; title: string; thumbnail: string | null };

export const board = new Hono();

board.get('/daily-winner', async (c) => {
  try {
    const [username, msUntilNext] = [
      (await reddit.getCurrentUsername()) ?? '',
      getMsUntilNextMidnightUTC(),
    ];
    const result = await getMostRecentDailyWinner();

    if (!result) {
      return c.json<DailyWinnerResponse>({ type: 'daily-winner', phase: 'no-winner', msUntilNext });
    }

    const { postId, date } = result;
    const meta = await getPostMeta(postId);
    if (!meta) {
      return c.json<DailyWinnerResponse>({ type: 'daily-winner', phase: 'no-winner', msUntilNext });
    }

    const [mediaData, { likes, dislikes }] = await Promise.all([
      getMediaData(postId, meta.contentType),
      getVoteCountsFor(postId, username),
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
        likes,
        dislikes,
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
    const username = (await reddit.getCurrentUsername()) ?? '';
    const today = getTodayDateUTC();
    const msUntilNext = getMsUntilNextMidnightUTC();

    const members = await redis.zRange(`daily:posts:${today}`, 0, -1, { by: 'rank' });

    const rows = await Promise.all(
      members.map(async ({ member: postId }) => {
        const [meta, { likes, dislikes }] = await Promise.all([
          getPostMeta(postId),
          getVoteCountsFor(postId, username),
        ]);
        if (!meta) return null;
        return { postId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, likes, dislikes };
      })
    );

    const valid = (rows.filter(Boolean) as NonNullable<typeof rows[number]>[])
      .sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes))
      .map((e, i) => ({ ...e, rank: i + 1 }));

    return c.json<DailyLeaderboardResponse>({ type: 'daily-leaderboard', date: today, msUntilNext, entries: valid });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.get('/weekly-leaderboard', async (c) => {
  try {
    const username = (await reddit.getCurrentUsername()) ?? '';
    const { round, phase, candidateIds, startMs, endMs, winnerId } = await getWeeklyState();

    const rows = await Promise.all(
      candidateIds.map(async (postId) => {
        const [meta, votes] = await Promise.all([
          getPostMeta(postId),
          getWeeklyVotes(round, postId, username),
        ]);
        if (!meta) return null;
        return { postId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, ...votes };
      })
    );

    const candidates = (rows.filter(Boolean) as NonNullable<typeof rows[number]>[]);
    if (phase !== 'collecting') {
      candidates.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));
    }

    return c.json<WeeklyLeaderboardResponse>({ type: 'weekly-leaderboard', round, phase, candidates, startMs, endMs, winnerId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.get('/weekly-winner', async (c) => {
  try {
    const username = (await reddit.getCurrentUsername()) ?? '';
    const { round, phase, candidateIds, endMs, winnerId } = await getWeeklyState();

    if (phase !== 'ended' || !winnerId) {
      return c.json<WeeklyWinnerResponse>({ type: 'weekly-winner', phase: phase as 'collecting' | 'active', round, candidateCount: candidateIds.length, endMs });
    }

    const meta = await getPostMeta(winnerId);
    if (!meta) {
      return c.json<WeeklyWinnerResponse>({ type: 'weekly-winner', phase: 'ended', round, entry: null });
    }

    const [mediaData, { likes, dislikes }] = await Promise.all([
      getMediaData(winnerId, meta.contentType),
      getWeeklyVotes(round, winnerId, username),
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
      entry: { postId: winnerId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, mediaData, thumbnailData, likes, dislikes },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.get('/meme-board', async (c) => {
  try {
    const username = (await reddit.getCurrentUsername()) ?? '';
    const page = parseInt(c.req.query('page') ?? '0');
    const pageSize = 20;
    const offset = page * pageSize;

    const total = await redis.zCard('posts:all');
    const members = await redis.zRange('posts:all', offset, offset + pageSize - 1, { by: 'rank', reverse: true });

    const rows = await Promise.all(
      members.map(async ({ member: postId }) => {
        const [meta, { likes, dislikes }] = await Promise.all([
          getPostMeta(postId),
          getVoteCountsFor(postId, username),
        ]);
        if (!meta) return null;
        return { postId, title: meta.title, authorUsername: meta.authorUsername, contentType: meta.contentType, likes, dislikes, createdAt: meta.createdAt };
      })
    );

    const entries = rows.filter(Boolean) as NonNullable<typeof rows[number]>[];
    return c.json<MemeBoardResponse>({ type: 'meme-board', entries, total, page });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});

board.post('/weekly-vote', async (c) => {
  try {
    const username = (await reddit.getCurrentUsername()) ?? '';
    if (!username) {
      return c.json<ErrorResponse>({ status: 'error', message: 'Must be logged in to vote' }, 401);
    }

    const { postId, action } = await c.req.json<WeeklyVoteRequest>();
    const { round, phase } = await getWeeklyState();

    if (phase !== 'active') {
      return c.json<ErrorResponse>({ status: 'error', message: 'Weekly voting is not active' }, 400);
    }

    const voteKey = `weekly:votes:${round}:${postId}`;
    const currentVote = await redis.hGet(voteKey, username);

    if (currentVote !== action) {
      await redis.hSet(voteKey, { [username]: action });
    }

    const { likes, dislikes } = await getWeeklyVotes(round, postId, username);
    return c.json<WeeklyVoteResponse>({ type: 'weekly-vote', postId, likes, dislikes, userVote: action });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json<ErrorResponse>({ status: 'error', message }, 500);
  }
});
