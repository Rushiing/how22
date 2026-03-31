"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = readTheme();
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    setMounted(true);
  }, []);

  const apply = (next: ThemeMode) => {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("theme", next);
  };

  if (!mounted) {
    return (
      <div
        className="inline-flex h-9 w-[4.75rem] rounded-full bg-zinc-200/90 p-0.5 dark:bg-zinc-700/90"
        aria-hidden
      />
    );
  }

  return (
    <div
      role="group"
      aria-label="外观"
      className="inline-flex h-9 rounded-full bg-zinc-200/90 p-0.5 dark:bg-zinc-800/90"
    >
      <button
        type="button"
        aria-label="浅色模式"
        aria-pressed={theme === "light"}
        onClick={() => apply("light")}
        className={`flex h-8 w-9 items-center justify-center rounded-full transition-colors ${
          theme === "light"
            ? "bg-white text-zinc-800 shadow-sm dark:bg-zinc-600 dark:text-zinc-100"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        aria-label="深色模式"
        aria-pressed={theme === "dark"}
        onClick={() => apply("dark")}
        className={`flex h-8 w-9 items-center justify-center rounded-full transition-colors ${
          theme === "dark"
            ? "bg-zinc-900 text-zinc-100 shadow-sm dark:bg-zinc-700 dark:text-zinc-50"
            : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <MoonIcon />
      </button>
    </div>
  );
}
