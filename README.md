# Verdant 🌿

**Stake STRK. Touch Grass. Earn Rewards.**

Verdant is a Decentralized Physical Infrastructure Network (DePIN) game on Starknet that rewards users for connecting with the outdoors.

## 🚀 Quick Start

1. **Setup Env**: `cp .env.example .env.local` (ensure `GEMINI_API_KEY` and `STARKNET_ADMIN_*` are set)
2. **Install**: `npm install`
3. **Run**: `npm run dev`

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Blockchain**: Starknet (Starkzap SDK + Social Login + Extensions)
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **AI**: Google Gemini 1.5 Flash for real-time proof-of-outdoor verification
- **Gasless**: Starkzap Paymaster for sponsored transactions

## 🏗 Key Features

- **Social Onboarding**: Connect via Email, Google, or Twitter using Starkzap Social Login—no extension required!
- **Gasless Staking**: Sponsored transactions for social users (powered by Starkzap Paymaster).
- **AI Verification**: Real-time image validation via Gemini-powered Supabase Edge Functions.
- **Backend NFT Relayer**: Secure server-side minting for milestone NFTs.
- **Alchemy RPC Fix**: Built-in network interceptor for seamless Alchemy RPC compatibility.
- **Anti-Cheating**: Verified daily submission limits (3 per day) to prevent spam.

## 📦 Database & Migrations

Deploy database changes and edge functions:

```bash
supabase db push
supabase functions deploy verify-submission
```

