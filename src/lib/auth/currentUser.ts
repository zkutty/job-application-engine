import { createSupabaseServerClient } from "@/lib/supabase/server";

type CurrentUser = {
  id: string;
  email: string;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return null;
  }

  return { id: user.id, email: user.email };
}
