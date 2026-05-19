import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          const store = cookieStore as unknown as {
            set?: (name: string, value: string, options: unknown) => void;
          };
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set?.(name, value, options)
          );
        } catch {
          // Server Components can't set cookies directly.
          // This is safe to ignore if you're only reading the session.
        }
      },
    },
  });
}
