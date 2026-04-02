"use client";

import { motion } from "framer-motion";
import {
  ArrowLeftRight,
  CircleDollarSign,
  Lock,
  RefreshCw,
  Share2,
  Wallet,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const features = [
  {
    icon: Wallet,
    title: "Wallet onboarding",
    body: "Demo StarkSigner onboarding on Sepolia — generate a key, deploy your account, and start saving in seconds.",
  },
  {
    icon: CircleDollarSign,
    title: "STRK and ERC-20",
    body: "Balances and transfers with sepoliaTokens — deposit STRK directly into your vault with real on-chain transactions.",
  },
  {
    icon: RefreshCw,
    title: "DCA into yield",
    body: "Schedule recurring buys via AVNU or Ekubo routes — set it once, keep stacking toward your goal automatically.",
  },
  {
    icon: ArrowLeftRight,
    title: "Swaps when you need them",
    body: "Rebalance inside a vault without leaving the flow — routes wired through Starkzap swap APIs.",
  },
  {
    icon: Share2,
    title: "Shared Flow Vaults",
    body: "Invite collaborators with a link — transparent member list and shared progress rings toward a common goal.",
  },
  {
    icon: Lock,
    title: "Optional Tongo privacy",
    body: "Confidential transfers when you want amounts shielded — opt-in, not mandatory.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <p
            id="starkzap"
            className="font-display text-sm font-medium uppercase tracking-wider text-primary"
          >
            Starkzap toolkit
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything in one SDK session
          </h2>
          <p className="mt-4 text-muted-foreground">
            Designed for Sepolia demos today and mainnet-ready patterns
            tomorrow — same wallet.transfer, DCA, and paymaster flow.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
            >
              <Card className="h-full border-border/60 transition-shadow duration-300 hover:border-primary/30 hover:shadow-glow-sm">
                <CardHeader className="pb-3">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" aria-hidden />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {f.body}
                  </CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}