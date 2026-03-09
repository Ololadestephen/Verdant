# Verdant Starknet Contracts (Sepolia)

This package contains:
- `TouchGrassStaking` with `stake(amount: u256)` and `unstake(amount: u256)`
- `TouchGrassMilestoneNFT` with `mint_milestone(to, milestone)`

## Prerequisites

1. Install Scarb
```bash
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh
```

2. Install Starkli
```bash
curl https://get.starkli.sh | sh
starkliup
```

3. Configure account
```bash
starkli account fetch <ACCOUNT_ADDRESS> --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7
export STARKNET_RPC=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
export STARKNET_ACCOUNT=<ACCOUNT_ADDRESS>
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json
```

## Build

From `touch-grass/contracts`:
```bash
scarb build
```

## Declare

```bash
starkli declare target/dev/touch_grass_contracts_TouchGrassStaking.contract_class.json --rpc $STARKNET_RPC
starkli declare target/dev/touch_grass_contracts_TouchGrassMilestoneNFT.contract_class.json --rpc $STARKNET_RPC
```

Save both returned class hashes.

## Deploy

1. Deploy staking
```bash
starkli deploy <STAKING_CLASS_HASH> --rpc $STARKNET_RPC
```

2. Deploy NFT contract with your admin address as constructor arg
```bash
starkli deploy <NFT_CLASS_HASH> $STARKNET_ACCOUNT --rpc $STARKNET_RPC
```

Save both deployed addresses.

## Wire app env

Update `/Users/apple/Desktop/Verdant/touch-grass/.env.local`:

```env
NEXT_PUBLIC_STARKNET_STAKING_CONTRACT=<DEPLOYED_STAKING_ADDRESS>
NEXT_PUBLIC_STARKNET_NFT_CONTRACT=<DEPLOYED_NFT_ADDRESS>
NEXT_PUBLIC_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io/rpc/v0_7
NEXT_PUBLIC_STARKNET_NETWORK=sepolia
```

Restart app:
```bash
npm run dev
```

## Post-deploy sanity checks

1. Call `stake` from UI and verify tx on Starkscan.
2. Call `staked_balance` via Starkli:
```bash
starkli call <DEPLOYED_STAKING_ADDRESS> staked_balance $STARKNET_ACCOUNT --rpc $STARKNET_RPC
```
3. Mint milestone from admin account and verify `has_milestone`:
```bash
starkli invoke <DEPLOYED_NFT_ADDRESS> mint_milestone $STARKNET_ACCOUNT 7 --rpc $STARKNET_RPC
starkli call <DEPLOYED_NFT_ADDRESS> has_milestone $STARKNET_ACCOUNT 7 --rpc $STARKNET_RPC
```
