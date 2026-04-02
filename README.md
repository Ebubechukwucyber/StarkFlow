# StarkFlow

> Personal and shared savings vaults on Starknet — powered by Starkzap SDK.

Built for the Starkzap hackathon. StarkFlow lets users create savings vaults, deposit STRK on Sepolia testnet, track yield, and manage goals — all with real on-chain transactions.

---

## Live Demo

> [Add your Vercel URL here after deployment]

---

## Features

- **Wallet onboarding** — Generate a demo private key, deploy your Starknet account in one click
- **Flow Vaults** — Create personal or shared savings vaults with a goal amount
- **Real deposits** — Deposit STRK on-chain via Starkzap SDK
- **Live yield tracking** — Chart updates after each deposit
- **Transaction history** — Every deposit links to Sepolia Voyager explorer
- **DCA setup** — Schedule recurring buys via AVNU or Ekubo
- **Shared vaults** — Invite link for group savings goals
- **Delete protection** — Vaults with funds cannot be deleted

---

## Tech Stack

- **Next.js 15** — App router, TypeScript
- **Starkzap SDK v2** — Wallet, deploy, transfer, paymaster
- **Starknet Sepolia** — Testnet
- **Tailwind CSS + shadcn/ui** — UI components
- **Framer Motion** — Animations
- **Recharts** — Yield chart

---

## Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/Ebubechukwucyber/StarkFlow.git
cd StarkFlow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:
```env
AVNU_API_KEY=your_avnu_api_key_here
```

> The app works without the AVNU key but deposits will use `user_pays` mode (requires STRK for gas).

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How to Use

1. Click **Launch Demo Vault** on the home page
2. Click **Generate** to create a demo private key
3. Click **Use key** to connect
4. Click **Deploy account** to deploy your Starknet account
5. Get free STRK from [https://blastapi.io/faucets/starknet-sepolia-strk](https://blastapi.io/faucets/starknet-sepolia-strk)
6. Open a vault and deposit STRK
7. Watch your balance and yield update in real time

---

## Project Structure
```
src/
  app/
    dashboard/        # Main dashboard
    vaults/
      [id]/           # Vault detail + deposit page
      create/         # Create new vault form
    onboard/          # Wallet onboarding
    api/paymaster/    # AVNU paymaster proxy
  components/
    dashboard/        # Dashboard views
    vault/            # Vault detail component
    landing/          # Landing page sections
    providers/        # Starkflow context provider
    layout/           # Header, footer, shell
  lib/
    mock/vaults.ts    # Vault store (localStorage)
    starkzap/         # SDK client setup
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AVNU_API_KEY` | Optional | AVNU paymaster key for sponsored txs |

---

## Hackathon Notes

- This is a Sepolia testnet demo — do not use on mainnet
- Private keys are stored in browser localStorage for demo purposes only
- Vault addresses are randomly generated for demo — in production these would be real on-chain contract addresses

---

## License

MIT