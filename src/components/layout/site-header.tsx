import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/#features", label: "Product" },
  { href: "/#starkzap", label: "Starkzap" },
  { href: "/dashboard", label: "Dashboard" },
];

type SiteHeaderProps = { className?: string };

export function SiteHeader({ className }: SiteHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          StarkFlow
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link href="/onboard">Sign in</Link>
          </Button>
          <Button size="sm" className="shadow-glow-sm" asChild>
            <Link href="/onboard">Launch App</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
