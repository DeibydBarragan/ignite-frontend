import { Suspense } from "react";
import { connection } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard-view";
import { AuthWallClient } from "@/features/auth/components/auth-wall-client";
import Loading from "./loading";

async function getSessionUser() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export default async function Page() {
  await connection();
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col relative selection:bg-purple-600 selection:text-white">
        <AuthWallClient />
      </div>
    );
  }

  return (
    <Suspense fallback={<Loading />}>
      <DashboardView />
    </Suspense>
  );
}
