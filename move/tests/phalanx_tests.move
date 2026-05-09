#[test_only]
module phalanx::phalanx_tests {
    use sui::tx_context::TxContext;
    use sui::test_scenario::{Self, ctx};

    use phalanx::agent::{Self, Agent, Role};
    use phalanx::phalanx;

    const ROLE_PROSKOPOS: u8 = 1;
    const ROLE_LOGISTES: u8 = 2;
    const ROLE_PRAXISTES: u8 = 3;
    const ROLE_PHYLAX: u8 = 4;

    #[test]
    fun test_create_agent() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        {
            let ctx = test_scenario::ctx(scenario);
            let agent = agent::create_agent(ROLE_PROSKOPOS, ctx);
            assert!(agent::get_role_variant(&agent.role) == ROLE_PROSKOPOS, 0);
            test_scenario::transfer(agent, @0x1);
        };

        test_scenario::end(ts);
    }

    #[test]
    #[expected_failure]
    fun test_invalid_role_fails() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        {
            let ctx = test_scenario::ctx(scenario);
            let _ = agent::create_agent(99, ctx);
        };

        test_scenario::end(ts);
    }

    #[test]
    fun test_role_validation() {
        assert!(agent::is_valid_role(ROLE_PROSKOPOS), 0);
        assert!(agent::is_valid_role(ROLE_LOGISTES), 1);
        assert!(agent::is_valid_role(ROLE_PRAXISTES), 2);
        assert!(agent::is_valid_role(ROLE_PHYLAX), 3);
        assert!(!agent::is_valid_role(0), 4);
        assert!(!agent::is_valid_role(5), 5);
        assert!(!agent::is_valid_role(99), 6);
    }

    #[test]
    fun test_phalanx_init_and_add_agent() {
        let commander = @0x1;
        let ts = test_scenario::begin(commander);
        let scenario = &mut ts;

        // Publish — init creates Phalanx and transfers to commander
        {
            phalanx::init(test_scenario::ctx(scenario));
        };

        // Add a Scout agent
        test_scenario::next_tx(scenario, commander);
        {
            // TODO: borrow Phalanx from commander address and call add_agent
            // This requires borrowing the Phalanx object via test_scenario::take
            let phalanx_obj = test_scenario::take_from_sender<phalanx::Phalanx>(scenario);
            phalanx::add_agent(&mut phalanx_obj, ROLE_PROSKOPOS, test_scenario::ctx(scenario));
            test_scenario::transfer(phalanx_obj, commander);
        };

        test_scenario::end(ts);
    }
}
