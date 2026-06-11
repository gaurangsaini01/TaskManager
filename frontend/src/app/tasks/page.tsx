"use client";

import { AuthGuard } from "@/components/auth-guard";
import { Navbar } from "@/components/navbar";

export default function TasksPage() {
  return (
    <AuthGuard>
      <Navbar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <h1 className="text-xl font-semibold text-foreground">Your tasks</h1>
      </main>
    </AuthGuard>
  );
}
