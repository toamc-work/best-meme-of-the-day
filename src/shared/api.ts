export const MAX_VIDEO_FILE_MB = 10;
export const MAX_IMAGE_FILE_MB = 10;
export const MAX_GIF_FILE_MB = 10;

export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
} & (
  | { mode: 'editor' }
  | {
      mode: 'viewer';
      contentType: 'image';
      imageData: string;
      likes: number;
      dislikes: number;
      userVote: 'like' | 'dislike' | null;
    }
  | {
      mode: 'viewer';
      contentType: 'video';
      videoData: string;
      thumbnailData: string | null;
      title: string;
      likes: number;
      dislikes: number;
      userVote: 'like' | 'dislike' | null;
    }
  | {
      mode: 'viewer';
      contentType: 'gif';
      gifData: string;
      title: string;
      likes: number;
      dislikes: number;
      userVote: 'like' | 'dislike' | null;
    }
);

export type PostMemeRequest = {
  imageData: string;
  title: string;
};

export type PostMemeResponse = {
  type: 'post-meme';
  postUrl: string;
};

export type PostVideoRequest = {
  videoData: string;
  thumbnailData: string | null;
  title: string;
};

export type PostVideoResponse = {
  type: 'post-video';
  postUrl: string;
};

export type PostGifRequest = {
  gifData: string;
  title: string;
};

export type PostGifResponse = {
  type: 'post-gif';
  postUrl: string;
};

export type VoteRequest = {
  action: 'like' | 'dislike';
};

export type VoteResponse = {
  type: 'vote';
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
};

export type CreateMemePostResponse = {
  type: 'create-meme-post';
  postUrl: string;
};

export type DailyWinnerEntry = {
  postId: string;
  title: string;
  authorUsername: string;
  contentType: 'image' | 'video' | 'gif';
  mediaData: string;
  thumbnailData: string | null;
  likes: number;
  dislikes: number;
  date: string;
};

export type DailyWinnerResponse =
  | { type: 'daily-winner'; phase: 'has-winner'; entry: DailyWinnerEntry; msUntilNext: number }
  | { type: 'daily-winner'; phase: 'no-winner'; msUntilNext: number };

export type DailyLeaderboardEntry = {
  postId: string;
  title: string;
  authorUsername: string;
  contentType: 'image' | 'video' | 'gif';
  likes: number;
  dislikes: number;
  rank: number;
};

export type DailyLeaderboardResponse = {
  type: 'daily-leaderboard';
  date: string;
  msUntilNext: number;
  entries: DailyLeaderboardEntry[];
};

export type WeeklyCandidate = {
  postId: string;
  title: string;
  authorUsername: string;
  contentType: 'image' | 'video' | 'gif';
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
};

export type WeeklyLeaderboardResponse = {
  type: 'weekly-leaderboard';
  round: number;
  phase: 'collecting' | 'active' | 'ended';
  candidates: WeeklyCandidate[];
  startMs: number | null;
  endMs: number | null;
  winnerId: string | null;
};

export type WeeklyWinnerEntry = {
  postId: string;
  title: string;
  authorUsername: string;
  contentType: 'image' | 'video' | 'gif';
  mediaData: string;
  thumbnailData: string | null;
  likes: number;
  dislikes: number;
};

export type WeeklyWinnerResponse =
  | { type: 'weekly-winner'; phase: 'ended'; round: number; entry: WeeklyWinnerEntry | null }
  | { type: 'weekly-winner'; phase: 'collecting' | 'active'; round: number; candidateCount: number; endMs: number | null };

export type MemeBoardEntry = {
  postId: string;
  title: string;
  authorUsername: string;
  contentType: 'image' | 'video' | 'gif';
  likes: number;
  dislikes: number;
  createdAt: number;
};

export type MemeBoardResponse = {
  type: 'meme-board';
  entries: MemeBoardEntry[];
  total: number;
  page: number;
};

export type WeeklyVoteRequest = {
  postId: string;
  action: 'like' | 'dislike';
};

export type WeeklyVoteResponse = {
  type: 'weekly-vote';
  postId: string;
  likes: number;
  dislikes: number;
  userVote: 'like' | 'dislike' | null;
};
