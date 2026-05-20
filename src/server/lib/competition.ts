import { redis } from '@devvit/web/server';

export type PostMeta = {
  authorUsername: string;
  title: string;
  contentType: 'image' | 'video' | 'gif';
  createdAt: number;
};

export function getTodayDateUTC(): string {
  return new Date().toISOString().split('T')[0] as string;
}

export function getDateUTC(daysAgo: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().split('T')[0] as string;
}

export function getMsUntilNextMidnightUTC(): number {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

export async function storePostMeta(
  postId: string,
  authorUsername: string,
  title: string,
  contentType: 'image' | 'video' | 'gif'
): Promise<void> {
  const createdAt = Date.now();
  const today = getTodayDateUTC();
  await Promise.all([
    redis.hSet(`post:meta:${postId}`, {
      authorUsername,
      title,
      contentType,
      createdAt: createdAt.toString(),
    }),
    redis.zAdd('posts:all', { score: createdAt, member: postId }),
    redis.zAdd(`daily:posts:${today}`, { score: createdAt, member: postId }),
  ]);
}

export async function getPostMeta(postId: string): Promise<PostMeta | null> {
  const h = await redis.hGetAll(`post:meta:${postId}`);
  if (!h?.authorUsername) return null;
  return {
    authorUsername: h.authorUsername,
    title: h.title ?? '',
    contentType: (h.contentType ?? 'image') as PostMeta['contentType'],
    createdAt: parseInt(h.createdAt ?? '0'),
  };
}

export async function getVoteCountsFor(
  postId: string,
  username = ''
): Promise<{ likes: number; dislikes: number; userVote: 'like' | 'dislike' | null }> {
  const h = await redis.hGetAll(`meme:votes:${postId}`);
  let likes = 0, dislikes = 0;
  let userVote: 'like' | 'dislike' | null = null;
  for (const [user, vote] of Object.entries(h ?? {})) {
    if (vote === 'like') likes++;
    else if (vote === 'dislike') dislikes++;
    if (user === username) userVote = vote as 'like' | 'dislike';
  }
  return { likes, dislikes, userVote };
}

export async function getWeeklyVotes(
  round: number,
  postId: string,
  username = ''
): Promise<{ likes: number; dislikes: number; userVote: 'like' | 'dislike' | null }> {
  const h = await redis.hGetAll(`weekly:votes:${round}:${postId}`);
  let likes = 0, dislikes = 0;
  let userVote: 'like' | 'dislike' | null = null;
  for (const [user, vote] of Object.entries(h ?? {})) {
    if (vote === 'like') likes++;
    else if (vote === 'dislike') dislikes++;
    if (user === username) userVote = vote as 'like' | 'dislike';
  }
  return { likes, dislikes, userVote };
}

async function addToWeeklyCandidates(postId: string): Promise<void> {
  const round = parseInt((await redis.get('weekly:round')) ?? '1');
  const key = `weekly:candidates:${round}`;
  const existing = await redis.zRange(key, 0, -1, { by: 'rank' });
  if (existing.some(m => m.member === postId)) return;
  const count = await redis.zCard(key);
  if (count >= 6) return;
  await redis.zAdd(key, { score: Date.now(), member: postId });
  if (count + 1 === 6) {
    await redis.set(`weekly:start:${round}`, Date.now().toString());
  }
}

export async function computeDailyWinner(date: string): Promise<string | null> {
  const cached = await redis.get(`daily:winner:${date}`);
  if (cached !== null) return cached || null;

  const members = await redis.zRange(`daily:posts:${date}`, 0, -1, { by: 'rank' });
  if (!members.length) {
    await redis.set(`daily:winner:${date}`, '');
    return null;
  }

  let bestId: string | null = null;
  let bestScore = -Infinity;
  for (const { member: pid } of members) {
    const { likes, dislikes } = await getVoteCountsFor(pid);
    const score = likes - dislikes;
    if (score > bestScore) { bestScore = score; bestId = pid; }
  }

  await redis.set(`daily:winner:${date}`, bestId ?? '');
  if (bestId) await addToWeeklyCandidates(bestId);
  return bestId;
}

export async function getMostRecentDailyWinner(): Promise<{ postId: string; date: string } | null> {
  for (let i = 1; i <= 14; i++) {
    const date = getDateUTC(i);
    const id = await computeDailyWinner(date);
    if (id) return { postId: id, date };
  }
  return null;
}

export type WeeklyPhase = 'collecting' | 'active' | 'ended';

export async function getWeeklyState(): Promise<{
  round: number;
  phase: WeeklyPhase;
  candidateIds: string[];
  startMs: number | null;
  endMs: number | null;
  winnerId: string | null;
}> {
  const round = parseInt((await redis.get('weekly:round')) ?? '1');
  const key = `weekly:candidates:${round}`;
  const members = await redis.zRange(key, 0, -1, { by: 'rank' });
  const candidateIds = members.map(m => m.member);

  const startStr = await redis.get(`weekly:start:${round}`);
  if (!startStr) {
    return { round, phase: 'collecting', candidateIds, startMs: null, endMs: null, winnerId: null };
  }

  const startMs = parseInt(startStr);
  const endMs = startMs + 7 * 24 * 60 * 60 * 1000;

  if (Date.now() < endMs) {
    return { round, phase: 'active', candidateIds, startMs, endMs, winnerId: null };
  }

  const existingWinner = await redis.get(`weekly:winner:${round}`);
  if (existingWinner !== null) {
    return { round, phase: 'ended', candidateIds, startMs, endMs, winnerId: existingWinner || null };
  }

  // Lazily declare winner
  let bestId: string | null = null, bestScore = -Infinity;
  for (const id of candidateIds) {
    const { likes, dislikes } = await getWeeklyVotes(round, id);
    const score = likes - dislikes;
    if (score > bestScore) { bestScore = score; bestId = id; }
  }
  await redis.set(`weekly:winner:${round}`, bestId ?? '');
  await redis.set('weekly:round', (round + 1).toString());

  return { round, phase: 'ended', candidateIds, startMs, endMs, winnerId: bestId };
}

export async function getMediaData(postId: string, contentType: PostMeta['contentType']): Promise<string | null> {
  if (contentType === 'image') return (await redis.get(`meme:${postId}`)) ?? null;
  const raw = await redis.get(contentType === 'video' ? `video:${postId}` : `gif:${postId}`);
  if (!raw) return null;
  return (JSON.parse(raw) as { data: string }).data;
}
