export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
} & (
  | { mode: 'editor' }
  | {
      mode: 'viewer';
      imageData: string;
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
