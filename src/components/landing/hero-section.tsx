"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Shield, Zap } from "lucide-react";

import { LaunchAppButton } from "@/components/auth/launch-app-button";
import { Button } from "@/components/ui/button";

const fade = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } };

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 bg-mesh-glow" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-glow/25 blur-[90px]" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={fade.initial}
          animate={{ ...fade.animate, transition: { duration: 0.55 } }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur-md"
        >
          <Zap className="h-3.5 w-3.5 text-glow" aria-hidden />
          Powered by Starkzap on Starknet Sepolia
        </motion.div>

        <motion.h1
          initial={fade.initial}
          animate={{
            ...fade.animate,
            transition: { duration: 0.55, delay: 0.05 },
          }}
          className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl md:leading-[1.08]"
        >
          Save globally.
          <br />
          <span className="bg-gradient-to-r from-primary via-violet-300 to-glow bg-clip-text text-transparent">
            Grow automatically.
          </span>
          <br />
          Zero hassle.
        </motion.h1>

        <motion.p
          initial={fade.initial}
          animate={{
            ...fade.animate,
            transition: { duration: 0.55, delay: 0.12 },
          }}
          className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Flow Vaults for personal and shared goals. Gasless USDC on Sepolia,
          DCA into yield via Ekubo, lend idle cash, optional private transfers —
          all in one premium wallet experience.
        </motion.p>

        <motion.div
          initial={fade.initial}
          animate={{
            ...fade.animate,
            transition: { duration: 0.55, delay: 0.18 },
          }}
          className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <LaunchAppButton className="group" />
          <Button variant="secondary" size="lg" asChild>
            <Link href="/#features">See how it works</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.35, duration: 0.5 } }}
          className="mt-12 flex flex-wrap items-center gap-6 text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" aria-hidden />
            Account abstraction · sponsored fees
          </span>
          <span className="hidden h-4 w-px bg-border sm:block" />
          <span>Cartridge social onboarding · Sepolia USDC</span>
        </motion.div>
      </div>
    </section>
  );
}
