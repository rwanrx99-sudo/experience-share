-- Schema สำหรับโปรเจกต์ "แชร์ประสบการณ์"
-- ใช้ใน Supabase SQL Editor แล้วกด Run

create extension if not exists pgcrypto;

-- POSTS
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  author_name text,
  author_avatar_url text,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "posts are public"
on public.posts
for select
using (true);

create policy "users can insert posts"
on public.posts
for insert
with check (auth.uid() = user_id);

-- COMMENTS (รองรับ reply ด้วย parent_id)
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  author_name text,
  author_avatar_url text,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments(post_id);
create index if not exists comments_parent_id_idx on public.comments(parent_id);

alter table public.comments enable row level security;

create policy "comments are public"
on public.comments
for select
using (true);

create policy "users can insert comments"
on public.comments
for insert
with check (auth.uid() = user_id);

-- REVIEWS (1 user รีวิวได้ 1 ครั้งต่อ 1 โพสต์)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null,
  author_name text,
  author_avatar_url text,
  rating int not null check (rating between 1 and 5),
  body text,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists reviews_post_id_idx on public.reviews(post_id);

alter table public.reviews enable row level security;

create policy "reviews are public"
on public.reviews
for select
using (true);

create policy "users can insert reviews"
on public.reviews
for insert
with check (auth.uid() = user_id);

create policy "users can update their reviews"
on public.reviews
for update
using (auth.uid() = user_id);

