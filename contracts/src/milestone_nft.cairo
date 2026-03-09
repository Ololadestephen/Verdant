#[starknet::interface]
pub trait ITouchGrassMilestoneNFT<TContractState> {
    fn set_admin(ref self: TContractState, new_admin: starknet::ContractAddress);
    fn mint_milestone(
        ref self: TContractState,
        to: starknet::ContractAddress,
        milestone: u32
    ) -> u256;
    fn owner_of_token(self: @TContractState, token_id: u256) -> starknet::ContractAddress;
    fn balance_of_owner(self: @TContractState, owner: starknet::ContractAddress) -> u256;
    fn get_token_milestone(self: @TContractState, token_id: u256) -> u32;
    fn has_milestone(
        self: @TContractState,
        owner: starknet::ContractAddress,
        milestone: u32
    ) -> bool;
    fn get_admin(self: @TContractState) -> starknet::ContractAddress;
}

#[starknet::contract]
mod TouchGrassMilestoneNFT {
    use starknet::ContractAddress;
    use starknet::get_caller_address;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess, StoragePointerWriteAccess};

    #[storage]
    struct Storage {
        admin: ContractAddress,
        next_token_id: u128,
        owner_of: Map<u128, ContractAddress>,
        balance_of: Map<ContractAddress, u128>,
        token_milestone: Map<u128, u32>,
        milestone_claimed: Map<(ContractAddress, u32), bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        MilestoneMinted: MilestoneMinted,
        AdminUpdated: AdminUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct MilestoneMinted {
        to: ContractAddress,
        milestone: u32,
        token_id: u256,
    }

    #[derive(Drop, starknet::Event)]
    struct AdminUpdated {
        old_admin: ContractAddress,
        new_admin: ContractAddress,
    }

    #[constructor]
    fn constructor(ref self: ContractState, admin: ContractAddress) {
        self.admin.write(admin);
        self.next_token_id.write(1);
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn assert_admin(self: @ContractState) {
            let caller = get_caller_address();
            assert(caller == self.admin.read(), 'ONLY_ADMIN');
        }

        fn assert_valid_milestone(milestone: u32) {
            assert(milestone == 7 || milestone == 30 || milestone == 100, 'INVALID_MILESTONE');
        }

        fn to_u128_id(token_id: u256) -> u128 {
            assert(token_id.high == 0, 'TOKEN_ID_TOO_LARGE');
            token_id.low
        }

        fn to_u256(value: u128) -> u256 {
            u256 { low: value, high: 0 }
        }
    }

    #[abi(embed_v0)]
    impl TouchGrassMilestoneNFTImpl of super::ITouchGrassMilestoneNFT<ContractState> {
        fn set_admin(ref self: ContractState, new_admin: ContractAddress) {
            InternalImpl::assert_admin(@self);
            let old_admin = self.admin.read();
            self.admin.write(new_admin);
            self.emit(Event::AdminUpdated(AdminUpdated { old_admin, new_admin }));
        }

        fn mint_milestone(ref self: ContractState, to: ContractAddress, milestone: u32) -> u256 {
            InternalImpl::assert_admin(@self);
            InternalImpl::assert_valid_milestone(milestone);

            let already_claimed = self.milestone_claimed.read((to, milestone));
            assert(!already_claimed, 'MILESTONE_ALREADY_MINTED');

            let token_id = self.next_token_id.read();
            self.next_token_id.write(token_id + 1);

            self.owner_of.write(token_id, to);
            self.token_milestone.write(token_id, milestone);
            self.milestone_claimed.write((to, milestone), true);

            let balance = self.balance_of.read(to);
            self.balance_of.write(to, balance + 1);

            let token_id_u256 = InternalImpl::to_u256(token_id);
            self.emit(Event::MilestoneMinted(MilestoneMinted {
                to,
                milestone,
                token_id: token_id_u256,
            }));

            token_id_u256
        }

        fn owner_of_token(self: @ContractState, token_id: u256) -> ContractAddress {
            self.owner_of.read(InternalImpl::to_u128_id(token_id))
        }

        fn balance_of_owner(self: @ContractState, owner: ContractAddress) -> u256 {
            InternalImpl::to_u256(self.balance_of.read(owner))
        }

        fn get_token_milestone(self: @ContractState, token_id: u256) -> u32 {
            self.token_milestone.read(InternalImpl::to_u128_id(token_id))
        }

        fn has_milestone(self: @ContractState, owner: ContractAddress, milestone: u32) -> bool {
            self.milestone_claimed.read((owner, milestone))
        }

        fn get_admin(self: @ContractState) -> ContractAddress {
            self.admin.read()
        }
    }
}
