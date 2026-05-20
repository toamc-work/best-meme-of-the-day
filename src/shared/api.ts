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
