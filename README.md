# Verdant 🌿

**Daily Outdoor Check-Ins & Milestone Proof Badges on BOT Chain**

Verdant connects everyday outdoor habits with on-chain proofs. Connect your EVM wallet, prove you've "touched grass" with verified photos, maintain consecutive daily streaks, and mint soulbound milestone badges on BOT Chain Mainnet.

## 🚀 Network Information

- **Network Name**: BOT Chain Mainnet
- **Chain ID**: `677` (`0x2a5`)
- **Native Currency**: `BOT`
- **RPC URL**: `https://rpc.botchain.ai`
- **Block Explorer**: [BotScan](https://scan.botchain.ai)

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + Viem
- **Smart Contract**: Solidity (`VerdantCheckIn.sol` on Foundry)
- **Blockchain**: BOT Chain (EVM Chain ID 677)
- **Backend**: Supabase (Database, Storage, Edge Functions)
- **AI Verification**: Real-time proof-of-outdoor vegetation analysis via Gemini
- **Security**: Challenge-response EVM authentication and canonical EIP-712 signed claim approvals

## 🏗 Key Features

- **EVM Wallet Authentication**: Cryptographic session challenge signed by user's EVM wallet (MetaMask, Rabby, etc.) with replay and expiration protection.
- **AI Outdoor Verification**: Real-time image validation of outdoor grass/vegetation with strict off-chain photo privacy.
- **On-Chain Check-In Claims**: Users sign and submit their own `checkIn` transactions on BOT Chain using server-approved EIP-712 signatures.
- **Soulbound Milestone Badges**: Non-transferable ERC-721 badges awarded on first check-in (Welcome Badge) and consecutive streak milestones (7, 30, and 100 days).
- **Daily Check-In Limit**: Strictly one confirmed on-chain check-in per wallet per UTC day.

## 🧪 Testing & Verification

```bash
# Run Vitest test suite (EVM auth, claim boundaries, validators)
npm test

# Run Solidity contract tests with Foundry
cd contracts/evm && forge test

# Typecheck and Next.js production build
npm run typecheck
npm run build
```
