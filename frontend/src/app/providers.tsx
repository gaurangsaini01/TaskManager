"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, useTheme } from "next-themes";
import { Toaster } from "sonner";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";

/** sonner's default "system" theme reads the OS preference, not our class — wire it to next-themes. */
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster richColors position="top-right" theme={resolvedTheme === "dark" ? "dark" : "light"} />
  );
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          {children}
          <ThemedToaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
