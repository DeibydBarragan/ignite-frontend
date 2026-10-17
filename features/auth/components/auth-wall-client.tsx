"use client";

import { useAuth } from "@/context/auth-context";
import { AuthWall } from "./auth-wall";
import { DashboardView } from "@/components/dashboard-view";

export function AuthWallClient() {
  const { isLoggedIn, isLoadingAuth, loginDiscord } = useAuth();

  if (isLoggedIn) {
    return <DashboardView />;
  }

  return <AuthWall isLoading={isLoadingAuth} onLogin={loginDiscord} />;
}
