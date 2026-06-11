"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const OPTIONS = [
  {
    value: "light",
    label: "Light theme",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
        <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.66 5.4a.75.75 0 00-1.06-1.06l-1.06 1.06a.75.75 0 101.06 1.06l1.06-1.06zM6.46 14.6a.75.75 0 00-1.06-1.06L4.34 14.6a.75.75 0 101.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.6 15.66a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06zM5.4 6.46A.75.75 0 006.46 5.4L5.4 4.34A.75.75 0 104.34 5.4L5.4 6.46z" />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M7.455 2.004a.75.75 0 01.26.77 7 7 0 009.958 7.967.75.75 0 011.067.853A8.5 8.5 0 116.647 1.921a.75.75 0 01.808.083z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    value: "system",
    label: "Follow system theme",
    icon: (
      <svg viewBox="0 0 20 20" className="size-4 fill-current" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M2 4.25A2.25 2.25 0 014.25 2h11.5A2.25 2.25 0 0118 4.25v8.5A2.25 2.25 0 0115.75 15h-3.105a3.501 3.501 0 001.1 1.677A.75.75 0 0113.26 18H6.74a.75.75 0 01-.484-1.323A3.501 3.501 0 007.355 15H4.25A2.25 2.25 0 012 12.75v-8.5zm1.5 0a.75.75 0 01.75-.75h11.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75H4.25a.75.75 0 01-.75-.75v-7.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // theme is undefined until mounted — render a same-size placeholder to avoid layout shift
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-8 w-[5.75rem] rounded-lg border border-edge" aria-hidden="true" />;
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex rounded-lg border border-edge bg-surface p-0.5"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            role="radio"
            aria-checked={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => setTheme(option.value)}
            className={`flex size-7 cursor-pointer items-center justify-center rounded-md transition-colors ${
              active ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground"
            }`}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
