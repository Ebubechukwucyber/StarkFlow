"use client";

import { motion } from "framer-motion";

import { mockTotals } from "@/lib/mock/vaults";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function StatsStrip() {
  const { totalSaved, yieldWeek, vaultCount } = mockTotals();

  const items = [
    { label: "Demo saved (vaults)", value: formatUsd(totalSaved) },
    { label: "Yield this week (mock)", value: `+${formatUsd(yieldWeek)}` },
    { label: "Active Flow Vaults", value: String(vaultCount) },
  ];

  return (
    <section className="border-y border-border/60 bg-card/25 py-10 backdrop-blur-sm">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:grid-cols-3 sm:px-6">
        {items.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08, duration: 0.45 }}
            className="text-center sm:text-left"
          >
            <p className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {item.value}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
