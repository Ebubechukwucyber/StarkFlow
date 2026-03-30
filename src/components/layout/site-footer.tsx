import Link from "next/link";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/60 bg-card/20 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-muted-foreground">
          © {year} StarkFlow · Starknet Sepolia testnet · Not financial advice.
        </p>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          <Link href="https://docs.starknet.io/build/starkzap/overview" className="hover:text-foreground">
            Starkzap docs
          </Link>
          <Link href="https://sepolia.voyager.online/" className="hover:text-foreground">
            Voyager Sepolia
          </Link>
          <Link href="https://starknet-faucet.vercel.app/" className="hover:text-foreground">
            Faucet
          </Link>
        </div>
      </div>
    </footer>
  );
}
