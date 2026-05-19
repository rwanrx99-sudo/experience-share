import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Comment, Post, Review } from "@/lib/db-types";
import { createComment, createReview } from "@/app/actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type CommentNode = Comment & { replies: CommentNode[] };

function buildCommentTree(comments: Comment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  comments.forEach((c) => byId.set(c.id, { ...c, replies: [] }));

  const roots: CommentNode[] = [];
  for (const node of byId.values()) {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortFn = (a: CommentNode, b: CommentNode) =>
    a.created_at.localeCompare(b.created_at);

  function sortRec(list: CommentNode[]) {
    list.sort(sortFn);
    list.forEach((n) => sortRec(n.replies));
  }
  sortRec(roots);

  return roots;
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="text-sm text-amber-600" aria-label={`คะแนน ${value}`}>
      {"★".repeat(full)}
      <span className="text-zinc-300">{"★".repeat(5 - full)}</span>
    </span>
  );
}

function CommentItem({
  node,
  postId,
  canReply,
  depth = 0,
}: {
  node: CommentNode;
  postId: string;
  canReply: boolean;
  depth?: number;
}) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">
            {node.author_name ?? "ผู้ใช้"}
          </div>
          <div className="text-xs text-zinc-500">{formatDate(node.created_at)}</div>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
          {node.content}
        </p>

        {canReply ? (
          <form action={createComment} className="mt-3 space-y-2">
            <input type="hidden" name="post_id" value={postId} />
            <input type="hidden" name="parent_id" value={node.id} />
            <textarea
              name="content"
              required
              rows={2}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
              placeholder="ตอบกลับ..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800"
              >
                ตอบกลับ
              </button>
            </div>
          </form>
        ) : null}
      </div>

      {node.replies.length > 0 ? (
        <div className="space-y-3 border-l border-zinc-200 pl-4">
          {node.replies.map((r) => (
            <CommentItem
              key={r.id}
              node={r}
              postId={postId}
              canReply={canReply && depth < 4}
              depth={depth + 1}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id,user_id,author_name,author_avatar_url,title,content,created_at")
    .eq("id", id)
    .single();

  if (postError || !post) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h1 className="text-xl font-semibold">ไม่พบโพสต์</h1>
        <p className="mt-2 text-sm text-zinc-600">
          ลิงก์อาจไม่ถูกต้อง หรือโพสต์ถูกลบไปแล้ว
        </p>
        <div className="mt-4">
          <Link href="/" className="text-sm font-medium underline">
            กลับไปหน้าแรก
          </Link>
        </div>
      </div>
    );
  }

  const postTyped = post as Post;

  const { data: commentsData } = await supabase
    .from("comments")
    .select(
      "id,post_id,user_id,author_name,author_avatar_url,parent_id,content,created_at"
    )
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const comments = (commentsData ?? []) as Comment[];
  const commentTree = buildCommentTree(comments);

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select(
      "id,post_id,user_id,author_name,author_avatar_url,rating,body,created_at"
    )
    .eq("post_id", id)
    .order("created_at", { ascending: false });

  const reviews = (reviewsData ?? []) as Review[];
  const avgRating =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;

  const canInteract = Boolean(user);

  return (
    <div className="space-y-6">
      {sp?.error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {sp.error}
        </div>
      ) : null}

      <article className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">{postTyped.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
              <span>โดย {postTyped.author_name ?? "ผู้ใช้"}</span>
              <span className="text-zinc-300">•</span>
              <span>{formatDate(postTyped.created_at)}</span>
              {reviews.length > 0 ? (
                <>
                  <span className="text-zinc-300">•</span>
                  <Stars value={avgRating} />{" "}
                  <span className="text-xs text-zinc-500">
                    ({reviews.length} รีวิว)
                  </span>
                </>
              ) : null}
            </div>
          </div>
          <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← กลับไปฟีด
          </Link>
        </div>

        <div className="mt-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-800">
            {postTyped.content}
          </p>
        </div>
      </article>

      <section
        id="reviews"
        className="rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">รีวิว</h2>
            <p className="mt-1 text-sm text-zinc-600">
              ให้คะแนน 1–5 และเขียนความคิดเห็นสั้นๆ ได้
            </p>
          </div>
          {reviews.length > 0 ? <Stars value={avgRating} /> : null}
        </div>

        {canInteract ? (
          <form action={createReview} className="mt-4 grid gap-3">
            <input type="hidden" name="post_id" value={id} />
            <label className="block">
              <span className="text-sm font-medium">คะแนน</span>
              <select
                name="rating"
                required
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                defaultValue="5"
              >
                <option value="5">5 - ดีมาก</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1 - ไม่โอเค</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">ข้อความ (ไม่บังคับ)</span>
              <textarea
                name="body"
                rows={3}
                className="mt-1 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
                placeholder="เช่น ข้อมูลละเอียด อ่านง่าย ได้ไอเดียเยอะ"
              />
            </label>
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                บันทึกรีวิว
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            ต้องเข้าสู่ระบบก่อนถึงจะรีวิวได้
          </div>
        )}

        <div className="mt-6 space-y-3">
          {reviews.length === 0 ? (
            <div className="text-sm text-zinc-600">ยังไม่มีรีวิว</div>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="rounded-md border border-zinc-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">
                    {r.author_name ?? "ผู้ใช้"}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {formatDate(r.created_at)}
                  </div>
                </div>
                <div className="mt-1">
                  <Stars value={r.rating} />
                </div>
                {r.body ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
                    {r.body}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </section>

      <section
        id="comments"
        className="rounded-lg border border-zinc-200 bg-white p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">คอมเมนต์</h2>
            <p className="mt-1 text-sm text-zinc-600">
              คอมเมนต์ได้ และตอบกลับเป็นเธรดได้
            </p>
          </div>
          <div className="text-sm text-zinc-500">{comments.length} ข้อความ</div>
        </div>

        {canInteract ? (
          <form action={createComment} className="mt-4 space-y-3">
            <input type="hidden" name="post_id" value={id} />
            <textarea
              name="content"
              required
              rows={3}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/10"
              placeholder="เขียนคอมเมนต์..."
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                ส่งคอมเมนต์
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            ต้องเข้าสู่ระบบก่อนถึงจะคอมเมนต์ได้
          </div>
        )}

        <div className="mt-6 space-y-4">
          {commentTree.length === 0 ? (
            <div className="text-sm text-zinc-600">ยังไม่มีคอมเมนต์</div>
          ) : (
            commentTree.map((c) => (
              <CommentItem
                key={c.id}
                node={c}
                postId={id}
                canReply={canInteract}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
