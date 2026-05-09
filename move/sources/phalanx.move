module phalanx::phalanx {
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::vector;

    use phalanx::agent::{Self, Agent, Role};
    use phalanx::events;

    const ENotCommander: u64 = 0;
    const EAgentNotFound: u64 = 1;
    const EInvalidThreshold: u64 = 2;
    const EPhalanxAlreadyExists: u64 = 3;

    const MAX_AGENTS: u64 = 16;
    const MIN_THRESHOLD: u8 = 1;
    const MAX_THRESHOLD: u8 = 10;

    struct Phalanx has key {
        id: UID,
        commander: address,
        agents: vector<ID>,
        palace_blob_id: vector<u8>,
        guardian_threshold: u8,
        created_at: u64,
    }

    struct AgentAdded has copy, drop {
        agent_id: ID,
        role: u8,
        commander: address,
        epoch: u64,
    }

    struct AgentRemoved has copy, drop {
        agent_id: ID,
        commander: address,
        epoch: u64,
    }

    struct PalaceUpdated has copy, drop {
        new_blob_id: vector<u8>,
        epoch: u64,
    }

    struct ThresholdChanged has copy, drop {
        old_threshold: u8,
        new_threshold: u8,
        epoch: u64,
    }

    fun init(ctx: &mut TxContext) {
        let commander = tx_context::sender(ctx);
        let phalanx = Phalanx {
            id: object::new(ctx),
            commander,
            agents: vector::empty(),
            palace_blob_id: vector::empty(),
            guardian_threshold: 5,
            created_at: tx_context::epoch(ctx),
        };
        transfer::transfer(phalanx, commander);
    }

    public entry fun add_agent(
        phalanx: &mut Phalanx,
        role_variant: u8,
        ctx: &mut TxContext,
    ) {
        assert!(tx_context::sender(ctx) == phalanx.commander, ENotCommander);
        assert!(vector::length(&phalanx.agents) < MAX_AGENTS, EAgentNotFound);

        let agent = agent::create_agent(role_variant, ctx);
        let agent_id = agent::get_agent_id(&agent);
        transfer::transfer(agent, phalanx.commander);
        vector::push_back(&mut phalanx.agents, agent_id);

        event::emit(AgentAdded {
            agent_id,
            role: role_variant,
            commander: phalanx.commander,
            epoch: tx_context::epoch(ctx),
        });
    }

    public entry fun remove_agent(
        phalanx: &mut Phalanx,
        agent_id: ID,
        ctx: &TxContext,
    ) {
        assert!(tx_context::sender(ctx) == phalanx.commander, ENotCommander);

        let len = vector::length(&phalanx.agents);
        let i = len;
        let found = false;

        while (i > 0) {
            i = i - 1;
            let current = *vector::borrow(&phalanx.agents, i);
            if (current == agent_id) {
                vector::remove(&mut phalanx.agents, i);
                found = true;
                i = 0;
            };
        };

        assert!(found, EAgentNotFound);

        event::emit(AgentRemoved {
            agent_id,
            commander: phalanx.commander,
            epoch: tx_context::epoch(ctx),
        });
    }

    public entry fun update_palace(
        phalanx: &mut Phalanx,
        new_blob_id: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(tx_context::sender(ctx) == phalanx.commander, ENotCommander);
        phalanx.palace_blob_id = new_blob_id;

        event::emit(PalaceUpdated {
            new_blob_id: phalanx.palace_blob_id,
            epoch: tx_context::epoch(ctx),
        });
    }

    public entry fun set_guardian_threshold(
        phalanx: &mut Phalanx,
        new_threshold: u8,
        ctx: &TxContext,
    ) {
        assert!(tx_context::sender(ctx) == phalanx.commander, ENotCommander);
        assert!(
            new_threshold >= MIN_THRESHOLD && new_threshold <= MAX_THRESHOLD,
            EInvalidThreshold,
        );

        let old = phalanx.guardian_threshold;
        phalanx.guardian_threshold = new_threshold;

        event::emit(ThresholdChanged {
            old_threshold: old,
            new_threshold,
            epoch: tx_context::epoch(ctx),
        });
    }

    public fun get_agents(phalanx: &Phalanx): &vector<ID> {
        &phalanx.agents
    }

    public fun get_commander(phalanx: &Phalanx): address {
        phalanx.commander
    }

    public fun get_palace_blob_id(phalanx: &Phalanx): &vector<u8> {
        &phalanx.palace_blob_id
    }

    public fun get_guardian_threshold(phalanx: &Phalanx): u8 {
        phalanx.guardian_threshold
    }

    public fun get_agent_count(phalanx: &Phalanx): u64 {
        vector::length(&phalanx.agents)
    }

    public fun contains_agent(phalanx: &Phalanx, agent_id: ID): bool {
        let len = vector::length(&phalanx.agents);
        let i = 0;
        while (i < len) {
            if (*vector::borrow(&phalanx.agents, i) == agent_id) {
                return true
            };
            i = i + 1;
        };
        false
    }
}
