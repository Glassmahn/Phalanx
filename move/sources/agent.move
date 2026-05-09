module phalanx::agent {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;

    const EInvalidRole: u64 = 0;

    const ROLE_PROSKOPOS: u8 = 1;
    const ROLE_LOGISTES: u8 = 2;
    const ROLE_PRAXISTES: u8 = 3;
    const ROLE_PHYLAX: u8 = 4;

    struct Role has copy, store, drop {
        variant: u8,
    }

    struct Agent has key, store {
        id: UID,
        role: Role,
        personal_blob_id: vector<u8>,
    }

    struct AgentCreated has copy, drop {
        agent_id: ID,
        role: u8,
        timestamp: u64,
    }

    public fun create_agent(role_variant: u8, ctx: &mut TxContext): Agent {
        assert!(is_valid_role(role_variant), EInvalidRole);
        let role = Role { variant: role_variant };
        let agent = Agent {
            id: object::new(ctx),
            role,
            personal_blob_id: vector::empty(),
        };
        event::emit(AgentCreated {
            agent_id: object::id(&agent),
            role: role_variant,
            timestamp: tx_context::epoch(ctx),
        });
        agent
    }

    public fun is_valid_role(variant: u8): bool {
        variant == ROLE_PROSKOPOS
            || variant == ROLE_LOGISTES
            || variant == ROLE_PRAXISTES
            || variant == ROLE_PHYLAX
    }

    public fun get_role_variant(role: &Role): u8 {
        role.variant
    }

    public fun get_agent_id(agent: &Agent): ID {
        object::id(agent)
    }

    public fun role_name(role: &Role): vector<u8> {
        if (role.variant == ROLE_PROSKOPOS) {
            b"proskopos"
        } else if (role.variant == ROLE_LOGISTES) {
            b"logistes"
        } else if (role.variant == ROLE_PRAXISTES) {
            b"praxistes"
        } else {
            b"phylax"
        }
    }
}
