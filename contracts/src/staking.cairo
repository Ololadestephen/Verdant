#[starknet::interface]
pub trait ITouchGrassStaking<TContractState> {
    fn stake(ref self: TContractState, amount: u256);
    fn unstake(ref self: TContractState, amount: u256);
    fn staked_balance(self: @TContractState, user: starknet::ContractAddress) -> u256;
    fn get_total_staked(self: @TContractState) -> u256;
}

#[starknet::contract]
mod TouchGrassStaking {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        stakes: Map<ContractAddress, u128>,
        total_staked: u128,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        Staked: Staked,
        Unstaked: Unstaked,
    }

    #[derive(Drop, starknet::Event)]
    struct Staked {
        user: ContractAddress,
        amount: u256,
        new_balance: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct Unstaked {
        user: ContractAddress,
        amount: u256,
        new_balance: u256,
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn to_u128_checked(amount: u256) -> u128 {
            assert(amount.high == 0, 'AMOUNT_TOO_LARGE');
            assert(amount.low > 0, 'INVALID_AMOUNT');
            amount.low
        }

        fn to_u256(value: u128) -> u256 {
            u256 { low: value, high: 0 }
        }
    }

    #[abi(embed_v0)]
    impl TouchGrassStakingImpl of super::ITouchGrassStaking<ContractState> {
        fn stake(ref self: ContractState, amount: u256) {
            let normalized = InternalImpl::to_u128_checked(amount);

            let caller = get_caller_address();
            let current = self.stakes.read(caller);
            let updated = current + normalized;

            self.stakes.write(caller, updated);
            self.total_staked.write(self.total_staked.read() + normalized);

            self.emit(Event::Staked(Staked {
                user: caller,
                amount,
                new_balance: InternalImpl::to_u256(updated),
            }));
        }

        fn unstake(ref self: ContractState, amount: u256) {
            let normalized = InternalImpl::to_u128_checked(amount);

            let caller = get_caller_address();
            let current = self.stakes.read(caller);
            assert(current >= normalized, 'INSUFFICIENT_STAKE');

            let updated = current - normalized;
            self.stakes.write(caller, updated);
            self.total_staked.write(self.total_staked.read() - normalized);

            self.emit(Event::Unstaked(Unstaked {
                user: caller,
                amount,
                new_balance: InternalImpl::to_u256(updated),
            }));
        }

        fn staked_balance(self: @ContractState, user: ContractAddress) -> u256 {
            InternalImpl::to_u256(self.stakes.read(user))
        }

        fn get_total_staked(self: @ContractState) -> u256 {
            InternalImpl::to_u256(self.total_staked.read())
        }
    }
}
