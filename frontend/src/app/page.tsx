"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageSpinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) return;
    router.replace(user ? "/tasks" : "/login");
  }, [isReady, user, router]);

  return <FullPageSpinner />;
}
