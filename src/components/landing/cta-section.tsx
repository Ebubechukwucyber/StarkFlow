"use client";
import { motion } from "framer-motion";

import { LaunchAppButton } from "@/components/auth/launch-app-button";

export function CtaSection() {
  return (
    <section className="pb-24 pt-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl px-4 sm:px-6"
      >
        <div className="relative overflow-hidden rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/20 via-card/80 to-background p-10 sm:p-14">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-glow/30 blur-[80px]" />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Ready to open your first Flow Vault?
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Next: Privy sign-in, dashboard with live Sepolia balances, and
              gasless deposits wired to Starkzap.
            </p>
            <LaunchAppButton className="mt-8" />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
