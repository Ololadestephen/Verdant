# Coding Agent Guide: Verdant BOT Check-Ins And Badges

Updated: 2026-11-07.
Repository: /Users/apple/Desktop/Verdant/touch-grass

Read applicable AGENTS.md instructions, plan.md, README.md, package scripts, and git status/diff before work. Follow the user's current authorization; do not start external actions merely because this file exists.

## Mission

Deliver the small outdoor-photo check-in and badge workflow on BOT Chain. Reuse the existing app and Supabase verification infrastructure. The first version excludes staking, financial rewards, gas sponsorship, and a new social-wallet platform.

## Source Reading Order

1. lib/starknet/wallet.ts, starkzap.ts, tx.ts, and admin-account.ts to map what must be replaced.
2. app/api/session/start/route.ts, active/route.ts, and status/route.ts.
3. lib/supabase/client.ts, server.ts, admin.ts, and repositories.ts.
4. Supabase migrations, especially wallet identity and RLS policies.
5. app/api/submission/create/route.ts and supabase/functions/verify-submission/index.ts.
6. lib/verification/validators.ts, reward.ts, and lib/time.ts.
7. app/api/profile/nfts/claim/route.ts and related profile/rewards endpoints.
8. components/wallet, components/session, components/verification, components/gamification, and components/stake.
9. Current Cairo contracts for behavior reference, not direct EVM reuse.

## First Concrete Task

Define the EVM authentication and approved-claim boundaries together. Trace how the server proves wallet/session/submission ownership before it can sign anything.

Then write focused tests for impersonation, cross-wallet access, expired/nonced signatures, and duplicate daily claims. Do not begin by swapping visible STRK labels for BOT.

## Implementation Order

1. Run the existing application/validator checks as a baseline.
2. Map Starknet-specific addresses, sessions, SDK calls, relayer endpoints, storage fields, and UI assumptions.
3. Add EVM wallet authentication with origin/action/address/expiry/nonce binding and server-side verification.
4. Define a canonical EIP-712 claim binding wallet, submission, UTC day, expiry, and replay identifier.
5. Implement/test one Solidity check-in/badge contract using an established badge primitive.
6. Adapt the existing verification service to approve and sign only owned, valid submissions within daily limits.
7. Make users submit their own claim transactions; replace the old Starknet admin-mint path.
8. Adapt dashboard, history, badges, and rewards copy; retire active staking/financial-reward controls.
9. Update database identity/RLS carefully without silently assigning old Starknet records to EVM users.
10. Add current chain configuration, footer links, docs, and local/browser release checks.

## Rules That Must Not Be Lost

- A client-supplied wallet address is not authentication.
- Wallet connection alone cannot access another account's submission.
- EIP-712 domain binds chain ID and verifying contract.
- Contract checks the approved signer, recipient, current UTC day, expiry, and unused reference.
- One confirmed check-in per wallet per UTC day; retries or reused photos cannot advance the streak repeatedly.
- Milestones derive from recorded progress. The welcome badge supports a truthful immediate demo; future streaks are tested with local fixtures/time advancement.
- Approval signing and database writes remain server-side, with narrow verified inputs.
- Photos, precise location, raw prompts, and credentials stay off-chain.
- AI image approval is a service judgment, not proof of unique humanity or physical presence.
- Badges are non-transferable in this release; enforce that in the chosen contract primitive.

## Verification Commands

```bash
npm run typecheck
npm test
npm run build
```

Add a small Solidity harness and contract tests as required. Inspect the installed Next.js/ESLint setup before relying on the current lint script. Record tool failures honestly.

Cover auth replay, wrong-origin signatures, address spoofing, unauthorized submission IDs, wrong chain/contract/wallet/day, expired approvals, duplicate claims, verifier rotation if implemented, badge callbacks/reentrancy, UTC boundaries, and missed-day streaks.

Check phone camera/upload, session refresh, network switching, rejected wallet signatures, pending/failed transactions, and actual explorer links. Model-backed photo checks require configured credentials and authorized budget; do not fake approval when a provider is unavailable.

## Migration And Release

Archive or clearly label legacy Cairo/STRK behavior. Do not carry forward stake counters as funded balances or retain financial reward promises without a funding mechanism. Preserve private records and use a reviewed, reversible database migration where possible.

Use a dedicated server verifier key and a separate project deployment wallet. No frontend environment variable may contain either private key.

## Completion Criteria

A participant can authenticate, submit an eligible photo, obtain the correct server approval, originate a real BOT Chain claim, and see the recorded check-in/badge. Unauthorized, stale, altered, and duplicate requests are rejected. Streaks reflect actual successful days.

## Quality And Handoff

Follow the user's current instructions and applicable AGENTS.md files. Before non-trivial implementation, check the baseline, ensure Desloppify state is ignored, and scan only the coherent application or contract boundary. Inspect status and next. After changes run appropriate format/static/tests/build checks and rescan. Do not exclude authored code, weaken tests, or mark findings resolved to improve a score artificially.

Keep dependencies/generated output and unrelated nested projects outside the work boundary. Preserve changes you did not make. Use existing libraries and local patterns; add abstractions only when they remove real complexity.

Complete independent reversible implementation work without unnecessary confirmation. Continue around missing credentials when possible using clearly labelled local fixtures. Ask for a decision only where it blocks the next dependent action. Follow actual user authorization for installations, paid services, mainnet transactions, deployment, posting, committing, and pushing.

Keep private keys and tokens in ignored local environment files. Avoid loading the owner's grant wallet as a deployment or service signer. Never print secrets, automatically publish social drafts, or claim unexecuted tests/deployments succeeded.

Use the program checklist in plan.md for external deliverables. Four participating wallets must have relevant successful originating transactions; record real sender addresses and hashes. Draft social content without inventing users, customers, metrics, or affiliations.

Append a dated execution note to plan.md at handoff:
- Completed tasks and exact files changed.
- Commands actually run and their outcomes, including baseline failures.
- Real deployment and verification evidence, if authorized and completed.
- Remaining risks/decisions, missing configuration, and the next exact action.

Distinguish local implementation, mainnet deployment, participant walkthrough, onboarding approval, and payment. Leave unchecked items incomplete. Recheck any old timeline if this guide is resumed later.

## Starting Prompt

> Read applicable AGENTS.md instructions, plan.md, and AGENT_GUIDE.md. Implement Verdant's small BOT Chain check-in/badge release, beginning with EVM session ownership and signed-claim tests. Preserve the existing verification infrastructure, remove active staking/financial promises, and complete contract/API/UI verification before reporting release status.
