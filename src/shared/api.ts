export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
} & ({ mode: 'editor' } | { mode: 'viewer'; imageData: string });

export type PostMemeRequest = {
  imageData: string;
  title: string;
};

export type PostMemeResponse = {
  type: 'post-meme';
  postUrl: string;
};
