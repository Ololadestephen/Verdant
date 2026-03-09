# Verdant 🌿

**Stake STRK. Touch Grass. Earn Rewards.**

Verdant is a Decentralized Physical Infrastructure Network (DePIN) game on Starknet that rewards users for connecting with the outdoors.

## 🚀 Quick Start

1. **Setup Env**: `cp .env.example .env.local`
2. **Install**: `npm install`
3. **Run**: `npm run dev`

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Blockchain**: Starknet (Starknet.js + Argent/Braavos)
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **AI**: OpenAI Vision API for proof-of-outdoor verification

## 🏗 Key Features

- **DeFi Staking**: Stake STRK to initiate an outdoor verification session.
- **AI Verification**: Real-time image validation via Supabase Edge Functions.
- **Gamification**: Streaks, rewards, and milestone NFTs.
- **Dashboard**: Command center for managing sessions and monitoring performance.

## 📦 Database & Migrations

Deploy database changes and edge functions:

```bash
supabase db push
supabase functions deploy verify-submission
```
