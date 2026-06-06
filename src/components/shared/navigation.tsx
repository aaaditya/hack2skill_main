"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/mood", label: "Mood Check-in" },
  { href: "/journal", label: "Journal" },
  { href: "/chat", label: "Wellness Chat" },
] as const;

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Main navigation"
        className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-4"
      >
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-lg text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
          aria-label="MindfulU home"
        >
          <Brain className="h-6 w-6" aria-hidden="true" />
          <span>MindfulU</span>
        </Link>

        <ul className="flex items-center gap-1" role="list">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={pathname === href ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  pathname === href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
