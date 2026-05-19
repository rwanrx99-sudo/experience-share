export type Post = {
  id: string;
  user_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  title: string;
  content: string;
  created_at: string;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  parent_id: string | null;
  content: string;
  created_at: string;
};

export type Review = {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  rating: number;
  body: string | null;
  created_at: string;
};

