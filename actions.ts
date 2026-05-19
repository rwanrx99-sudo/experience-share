"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getAuthorFromUser(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}) {
  const md = user.user_metadata ?? {};
  const author_name =
    (md["full_name"] as string | undefined) ||
    (md["name"] as string | undefined) ||
    (md["preferred_username"] as string | undefined) ||
    user.email ||
    null;
  const author_avatar_url =
    (md["avatar_url"] as string | undefined) ||
    (md["picture"] as string | undefined) ||
    null;
  return { author_name, author_avatar_url };
}

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    redirect("/");
  }
  return { supabase, user };
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  redirect("/");
}

export async function createPost(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!title || !content) {
    redirect("/new?error=กรุณากรอกหัวข้อและเนื้อหา");
  }

  const { author_name, author_avatar_url } = getAuthorFromUser(user);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      title,
      content,
      user_id: user.id,
      author_name,
      author_avatar_url,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/new?error=${encodeURIComponent(error?.message || "บันทึกไม่สำเร็จ")}`);
  }

  revalidatePath("/");
  redirect(`/post/${data.id}`);
}

export async function createComment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const post_id = String(formData.get("post_id") || "");
  const parent_idRaw = formData.get("parent_id");
  const parent_id = parent_idRaw ? String(parent_idRaw) : null;
  const content = String(formData.get("content") || "").trim();

  if (!post_id || !content) {
    redirect(`/post/${post_id}`);
  }

  const { author_name, author_avatar_url } = getAuthorFromUser(user);

  const { error } = await supabase.from("comments").insert({
    post_id,
    parent_id,
    content,
    user_id: user.id,
    author_name,
    author_avatar_url,
  });

  if (error) {
    redirect(`/post/${post_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/post/${post_id}`);
  redirect(`/post/${post_id}#comments`);
}

export async function createReview(formData: FormData) {
  const { supabase, user } = await requireUser();
  const post_id = String(formData.get("post_id") || "");
  const rating = Number(formData.get("rating") || 0);
  const body = String(formData.get("body") || "").trim();

  if (!post_id || !(rating >= 1 && rating <= 5)) {
    redirect(`/post/${post_id}`);
  }

  const { author_name, author_avatar_url } = getAuthorFromUser(user);

  const { error } = await supabase.from("reviews").upsert(
    {
      post_id,
      rating,
      body: body || null,
      user_id: user.id,
      author_name,
      author_avatar_url,
    },
    { onConflict: "post_id,user_id" }
  );

  if (error) {
    redirect(`/post/${post_id}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/post/${post_id}`);
  redirect(`/post/${post_id}#reviews`);
}
