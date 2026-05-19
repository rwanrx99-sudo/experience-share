import Link from "next/link";
import AuthButtons from "@/components/AuthButtons";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions";

export default async function Header() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-base font-semibold">
            แชร์ประสบการณ์
          </Link>
          <nav className="hidden items-center gap-3 text-sm text-zinc-600 sm:flex">
            <Link href="/" className="hover:text-zinc-900">
              ฟีด
            </Link>
            <Link href="/new" className="hover:text-zinc-900">
              เขียนโพสต์
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-zinc-600 sm:block">
                {user.email ?? "เข้าสู่ระบบแล้ว"}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                >
                  ออกจากระบบ
                </button>
              </form>
            </>
          ) : (
            <AuthButtons />
          )}
        </div>
      </div>
    </header>
  );
}
