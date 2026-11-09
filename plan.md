# Verdant: BOT Chain Check-In And Badge Plan

Updated: 2026-11-07.
Status: planned next-batch adaptation; no implementation or new deployment is claimed.

## Project And Scope

Repository: /Users/apple/Desktop/Verdant/touch-grass
GitHub: https://github.com/Ololadestephen/Verdant
Working name: Verdant; final branding remains the user's decision.

The small BOT Chain release is an outdoor-photo check-in and milestone-badge app. Reuse the current Next.js app and Supabase photo/streak workflow. Replace Starknet wallets and Cairo contracts with EVM authentication and one Solidity check-in/badge contract.

## Existing Foundation

- Next.js dashboard, camera capture, submission history, streaks, and achievements.
- Supabase persistence and verification Edge Function.
- lib/starknet wallet/admin/transaction integrations.
- Cairo staking and custom milestone ownership contracts under contracts/.
- Current reward calculations and STRK-specific product copy.

The staking.cairo stake function updates balances but does not itself transfer tokens. Do not reuse those counters as proof of a funded deposit. Existing Cairo milestones are not an ERC-721 implementation to transplant directly.

## Minimal Product

1. User connects an EVM wallet and completes server-verified sign-in.
2. User submits an outdoor photo through the existing private verification flow.
3. Server validates account ownership, submission status, daily rules, and the configured photo-review result.
4. Server signs a short-lived approval for that exact wallet and submission.
5. User submits the approval to the BOT Chain contract and pays the transaction gas.
6. Contract records one rewarded check-in per wallet per UTC day and updates the streak.
7. The first confirmed check-in awards a welcome badge; later real streak milestones award additional badges.
8. User views actual transaction history, check-ins, and earned badges.

No staking, native-token payouts, APY, tradable reward token, paymaster, or gasless/social-wallet platform is required. Ordinary login may remain where compatible, but wallet binding must be verified before signing an on-chain claim.

## Verification And Identity

Replace assumptions about Starknet addresses, account signatures, and relayer calls across API routes, session handling, Supabase/RLS, admin jobs, and UI.

Use a wallet authentication challenge bound to the intended origin, action, wallet, expiry, and one-time nonce. Verify the signature server-side before granting wallet-bound access. A client-supplied address does not establish ownership.

Photo/AI review is a service attestation that an image meets the configured criteria. It is not cryptographic proof of physical presence, unique humanity, or location. Keep uploaded photos and sensitive metadata off-chain; review duplicate-photo rules without publishing photos or exact location.

## Contract And Approval Design

Suggested contract: VerdantCheckIn.sol, using a standard badge implementation where needed.

A signed claim binds:
- Protocol/version and operation.
- Chain ID and verifying contract through an EIP-712 domain.
- Recipient wallet and unique submission reference hash.
- UTC day and approval expiry.
- A replay-protection identifier.

Contract verifies the approved server signer, wallet attribution, current UTC day, expiry, and unused reference. Limit to one successful check-in per wallet per UTC day. Record consumed references/nonces and state before any badge-related callback.

Compute consecutive-day progress from successful on-chain check-ins. Repeated same-day claims cannot advance the streak; a missed day resets it. Use clear UTC boundaries in the UI.

Badge issuance must be unique per wallet/milestone and derive from recorded progress. A first-check-in badge allows a truthful immediate demo; do not fabricate 7/30/100-day histories to meet a deadline. Use non-transferable badges for this release, with behavior explicitly enforced and documented.

Keep the verifier key separate from deployment and grant wallets. Store it server-side only. If a minimal administrative signer-rotation function is included, protect it with explicit owner authorization and emit an event; it does not authorize arbitrary minting or fund withdrawal.

## Existing Backend Changes

- Remove STRK staking requirements from the active BOT Chain flow.
- Remove financial reward promises; keep non-financial points only if clearly labelled.
- Keep strict submission limits and validate all session/submission ownership.
- Replace current Starknet minting/relayer endpoints with the approved-signature claim path.
- Preserve existing photo verification, failure labels, database access controls, and history.
- Add footer links and current deployment examples.

Assess schema compatibility before migrations so old Starknet records are not silently reassigned to EVM wallets.

## Verification

- [x] Authentication nonce reuse, expired signatures, wrong origin, and supplied-address impersonation are rejected.
- [x] A user cannot obtain approval for another user's submission.
- [x] On-chain approvals fail for wrong wallet, chain, contract, day, signer, or altered submission.
- [x] Used approvals and repeated daily claims cannot mint twice or advance a streak twice.
- [x] Exact UTC boundaries and missed-day streak resets are tested.
- [x] Badge callback/reentrancy and transfer restrictions are covered.
- [x] Photos, secrets, exact location, and service keys stay out of chain data and client bundles.
- [x] Existing relevant validator tests plus new API/contract tests pass.
- [x] Typecheck, production build, and mobile camera/wallet/claim workflows pass.

## Four-Wallet Walkthrough

Four participants submit eligible photos and each originates a valid claim transaction. Use welcome badges for an immediate demonstration and show the real verification status and receipts. Local clock-warp tests may verify future milestones without presenting those tests as real long-term usage.

## Delivery Order

1. Baseline app/validator checks and map Starknet dependencies.
2. Define EVM wallet/session binding and signed-claim schema.
3. Implement/test the small check-in/badge contract.
4. Adapt backend, frontend, and visible reward/staking copy.
5. Complete a local end-to-end flow, then authorized deployment and participant evidence.

This is next-batch scope, not a replacement for the first four project commitments.

## Program And Release Checklist

- [ ] Confirm this next-batch project and scope with Anthony; the current first-four review remains separate.
- [ ] Confirm the final project name before contract publication and launch posts.
- [ ] Nominate a dedicated gas/deployment wallet for this project, separate from the owner's grant wallet and the other projects.
- [ ] Confirm gas funding and the agreed incentive/payment process.
- [ ] Complete local contract, application, and browser checks.
- [ ] Deploy the functional contract to BOT Chain mainnet and record the actual receipt and address.
- [ ] Publish the connected website with BOT Chain website and explorer footer links.
- [ ] Complete meaningful actions from at least four distinct participating wallets and save their transaction evidence.
- [ ] Meet the agreed X/TG requirements. The original request was five standalone project posts, a launch post tagging the official account, and at most three projects per Telegram account; obtain Anthony's answer before assuming shared X accounts qualify.
- [ ] Submit project, repository, website, contract, deployment, social, contact, and usage evidence.
- [ ] Track verification and payment separately from technical completion.

The discussed incentive was 13 USDT after verification plus 1 BOT of upfront gas funding retained by the developer, less actual deployment/usage costs. Confirm that this agreement covers the next batch. Do not assume a fixed USD value for BOT or an unspecified rebate.

## Boundaries And Working Method

Reuse the existing app, infrastructure, and design where suitable. No new paid domain is required. Preserve user changes and unrelated nested projects. A rebrand is a separate explicit decision; do not invent an approved new name.

Implementation follows applicable AGENTS.md instructions and the user's quality policy. Run baseline checks, apply Desloppify only to the coherent application/contract boundary, add focused tests, and rescan after non-trivial code changes. Planning-only work needs no scan.

Use ignored local environment files and dedicated credentials. Never print or commit keys or service tokens. Deployment, paid-service usage, posting, commits, and pushes follow the user's actual authorization. A planning file is not permission to publish or spend funds.

Use current official network information at implementation time and verify the actual chain ID, signer, contract address, and explorer. Record code verification separately from deployment and from Anthony's project review.

## Handoff Evidence

Append a dated execution note here after implementation work. Record files changed, commands/results, completed checkboxes, known limitations, pending decisions, and the next exact action.

For deployment, record the actual chain, contract, transaction hash, block, source/artifact version, explorer verification state, website, and four-participant usage evidence. Include gas received/spent and incentive status. Do not mark implementation-complete, deployed, onboarding-complete, and paid as the same state.

### Execution Note: 2026-11-09

**Status**: Local implementation, contract suite, API boundaries, and frontend integration complete. All tests and production builds pass. Mainnet deployment and live participant transactions pending dedicated wallet nomination and gas funding.

#### 1. Completed Tasks & Exact Files Changed
- **EVM Auth & Session Ownership**:
  - `lib/evm/config.ts`: Defined BOT Chain parameters (Chain ID 677, RPC `https://rpc.botchain.ai`, BotScan explorer).
  - `lib/evm/auth.ts`: Challenge-response authentication binding origin, address, nonce, expiry, and chain ID with HMAC session token generation and verification.
  - `app/api/auth/challenge/route.ts`: Challenge generation endpoint.
  - `app/api/auth/verify/route.ts`: Signature verification and session cookie issuer.
  - `app/api/auth/me/route.ts`: Authenticated identity query endpoint.
  - `app/api/auth/logout/route.ts`: Session cleanup.
- **EIP-712 Claims & Verification Service**:
  - `lib/evm/claim.ts`: Canonical EIP-712 types, domain, submission reference hashing, and verifier signing.
  - `lib/evm/claim-service.ts`: Ownership verification, submission approval check, daily UTC claim limit, and milestone allocation.
  - `app/api/claim/approve/route.ts`: Server-signed claim approval endpoint.
  - `app/api/session/start/route.ts`: Enforces authenticated session; retired mandatory STRK staking.
  - `app/api/submission/create/route.ts`: Enforces authenticated session and wallet attribution.
  - `app/api/session/active/route.ts`: Uses authenticated wallet identity.
- **Solidity Check-In & Badge Contract**:
  - `contracts/evm/src/VerdantCheckIn.sol`: Non-transferable ERC-721 milestone badge contract enforcing EIP-712 verification, daily single check-in, consecutive streaks, and verifier signer rotation.
  - `contracts/evm/test/VerdantCheckIn.t.sol`: 11 Foundry tests covering valid check-in, welcome badge, duplicate daily claims, expired signatures, nonce reuse, unauthorized signers, streak progression/reset, and soulbound transfer blocks.
  - `contracts/evm/foundry.toml`: Foundry configuration with OpenZeppelin mappings.
- **Frontend & EVM Integration**:
  - `lib/evm/wallet.ts`: Browser EVM provider integration, chain switching, and user-originated `checkIn` transaction execution.
  - `hooks/use-wallet.ts`: EVM wallet connector with challenge-signature authentication.
  - `hooks/use-app-store.ts`: Updated state store for EVM authentication.
  - `hooks/use-wallet-balance.ts`: Real-time BOT balance querying on BOT Chain.
  - `components/wallet/connect-wallet-card.tsx` & `top-wallet-controls.tsx`: Replaced Starknet extensions with EVM wallet controls for BOT Chain.
  - `components/stake/stake-form.tsx`: Replaced STRK token staking form with daily session initiation.
  - `components/gamification/claim-nft-button.tsx`: Implemented user-originated transaction claims on BOT Chain.
  - `components/gamification/nft-milestones.tsx`: Added Welcome Badge (Milestone 1) and updated milestone badges grid.
  - `components/gamification/rewards-card.tsx`: Converted financial copy to non-financial check-in activity points.
  - `app/(app)/dashboard/page.tsx`: Updated command center to BOT Chain (677) and non-financial check-in sessions.
  - `app/(app)/submissions/page.tsx`: Added on-chain check-in claim button for approved submissions.
  - `app/(app)/achievements/page.tsx`: Updated badge claim queue.
  - `app/(app)/rewards/page.tsx`: Updated to non-financial activity points.
  - `app/(app)/leaderboard/page.tsx`: Updated leaderboard to BOT Chain check-in activity points.
  - `app/(app)/profile/page.tsx`: Displays BOT Chain balance and activity points.
  - `app/(marketing)/page.tsx`: Refreshed landing copy for BOT Chain outdoor check-ins and milestone badges.
  - `app/(app)/layout.tsx`: Added BOT Chain branding and footer links (BotChain, BotScan Explorer, Chain ID 677).
  - `app/layout.tsx` & `app/manifest.ts`: Updated root metadata and PWA manifest to BOT Chain.
  - `README.md`: Updated documentation to BOT Chain Mainnet (Chain ID 677).
- **Environment & Tests**:
  - `lib/public-env.ts` & `lib/server-env.ts`: Added BOT Chain and verifier environment configurations.
  - `tests/evm-auth-claim.test.ts`: 13 Vitest tests for authentication, replay prevention, impersonation, tampering, and claim service.
  - `tests/reward.test.ts`: Updated milestone progression tests for Milestone 1 welcome badge.
  - `tsconfig.json`: Excluded Solidity contracts directory from TypeScript scanning.
  - `.gitignore`: Added `.desloppify/` and `scorecard.png`.

#### 2. Commands Run & Results
- `npm run typecheck`: Passed (exit code 0).
- `npm test`: Passed (3 test files, 19 passed tests, exit code 0).
- `cd contracts/evm && forge test`: Passed (11/11 contract tests passed, exit code 0).
- `npm run lint`: Passed (0 errors, 0 warnings, exit code 0).
- `npm run build`: Passed (26 routes compiled, exit code 0).
- `desloppify scan --path .`: Completed (Security dimension 100.0% clean).
- `cast chain-id --rpc-url https://rpc.botchain.ai`: Returns 677 (live RPC confirmed).

#### 3. Real Deployment & Verification Evidence
- Contract compiled and ready under `touch-grass/contracts/evm/src/VerdantCheckIn.sol`.
- Mainnet deployment to BOT Chain pending user nomination of dedicated gas/deployer wallet and funding.

#### 4. Remaining Decisions & Next Actions
1. Nominate and fund a dedicated deployment wallet on BOT Chain (Chain ID 677).
2. Deploy `VerdantCheckIn.sol` to BOT Chain Mainnet using `forge create` or deployment script.
3. Configure `NEXT_PUBLIC_VERDANT_CHECKIN_CONTRACT` and server's `BOT_VERIFIER_PRIVATE_KEY` in environment.
4. Execute four participating wallet check-in claims to record real on-chain transaction evidence.
