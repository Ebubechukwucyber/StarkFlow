"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useStarkflow } from "@/hooks/use-starkflow";

type Props = {
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
};

export function LaunchAppButton({
  className,
  size = "lg",
  variant = "glow",
}: Props) {
  const router = useRouter();
  const { onboardDemo, loading } = useStarkflow();

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
      onClick={() => {
        void onboardDemo().then((ok) => {
          if (ok) router.push("/dashboard");
          else router.push("/onboard");
        });
      }}
    >
      {loading ? "Connecting..." : "Launch Demo Vault"}
      <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
    </Button>
  );
}
