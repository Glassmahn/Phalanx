#[test_only]
module phalanx::phalanx_tests {
    use sui::test_scenario;
    use sui::transfer;
    use std::vector;

    use phalanx::agent;
    use phalanx::phalanx;

    const ROLE_PROSKOPOS: u8 = 1;
    const ROLE_LOGISTES: u8 = 2;
    const ROLE_PRAXISTES: u8 = 3;
    const ROLE_PHYLAX: u8 = 4;

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
    fun test_create_agent() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        let agent_obj = agent::create_agent(ROLE_PROSKOPOS, test_scenario::ctx(scenario));
        let role = agent::get_role(&agent_obj);
        assert!(agent::get_role_variant(role) == ROLE_PROSKOPOS, 0);
        transfer::public_transfer(agent_obj, @0x1);

        test_scenario::end(ts);
    }

    #[test]
    fun test_phalanx_defaults() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        let phalanx_obj = phalanx::init_for_testing(test_scenario::ctx(scenario));

        assert!(phalanx::get_commander(&phalanx_obj) == @0x1, 0);
        assert!(phalanx::get_agent_count(&phalanx_obj) == 0, 1);
        assert!(phalanx::get_guardian_threshold(&phalanx_obj) == 5, 2);

        transfer::public_transfer(phalanx_obj, @0x1);
        test_scenario::end(ts);
    }

    #[test]
    fun test_add_agent_to_phalanx() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        let phalanx_obj = phalanx::init_for_testing(test_scenario::ctx(scenario));

        phalanx::add_agent(&mut phalanx_obj, ROLE_PROSKOPOS, test_scenario::ctx(scenario));
        assert!(phalanx::get_agent_count(&phalanx_obj) == 1, 0);

        phalanx::add_agent(&mut phalanx_obj, ROLE_LOGISTES, test_scenario::ctx(scenario));
        assert!(phalanx::get_agent_count(&phalanx_obj) == 2, 1);

        transfer::public_transfer(phalanx_obj, @0x1);
        test_scenario::end(ts);
    }

    #[test]
    fun test_set_guardian_threshold() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        let phalanx_obj = phalanx::init_for_testing(test_scenario::ctx(scenario));

        assert!(phalanx::get_guardian_threshold(&phalanx_obj) == 5, 0);
        phalanx::set_guardian_threshold(&mut phalanx_obj, 8, test_scenario::ctx(scenario));
        assert!(phalanx::get_guardian_threshold(&phalanx_obj) == 8, 1);

        transfer::public_transfer(phalanx_obj, @0x1);
        test_scenario::end(ts);
    }

    #[test]
    fun test_update_palace_blob() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        let phalanx_obj = phalanx::init_for_testing(test_scenario::ctx(scenario));

        let blob_id = b"test_blob_id_123";
        phalanx::update_palace(&mut phalanx_obj, blob_id, test_scenario::ctx(scenario));

        let stored = phalanx::get_palace_blob_id(&phalanx_obj);
        assert!(*stored == blob_id, 0);

        transfer::public_transfer(phalanx_obj, @0x1);
        test_scenario::end(ts);
    }

    #[test]
    fun test_remove_agent() {
        let ts = test_scenario::begin(@0x1);
        let scenario = &mut ts;

        let phalanx_obj = phalanx::init_for_testing(test_scenario::ctx(scenario));

        phalanx::add_agent(&mut phalanx_obj, ROLE_PROSKOPOS, test_scenario::ctx(scenario));
        phalanx::add_agent(&mut phalanx_obj, ROLE_LOGISTES, test_scenario::ctx(scenario));
        assert!(phalanx::get_agent_count(&phalanx_obj) == 2, 0);

        let agents = phalanx::get_agents(&phalanx_obj);
        let first_agent_id = *vector::borrow(agents, 0);
        phalanx::remove_agent(&mut phalanx_obj, first_agent_id, test_scenario::ctx(scenario));
        assert!(phalanx::get_agent_count(&phalanx_obj) == 1, 1);

        transfer::public_transfer(phalanx_obj, @0x1);
        test_scenario::end(ts);
    }
}
