module phalanx::events {
    use sui::object::ID;

    const ROLE_PROSKOPOS: u8 = 1;
    const ROLE_LOGISTES: u8 = 2;
    const ROLE_PRAXISTES: u8 = 3;
    const ROLE_PHYLAX: u8 = 4;

    struct ObservationReport has copy, drop {
        agent_id: ID,
        role: u8,
        epoch: u64,
        palace_ref: vector<u8>,
    }

    struct AnalystProposal has copy, drop {
        agent_id: ID,
        role: u8,
        epoch: u64,
        risk_score: u8,
        proposal_hash: vector<u8>,
    }

    struct GuardianVerdict has copy, drop {
        agent_id: ID,
        role: u8,
        epoch: u64,
        approved: bool,
        threshold_used: u8,
    }

    struct ExecutorResult has copy, drop {
        agent_id: ID,
        role: u8,
        epoch: u64,
        tx_digest: vector<u8>,
        success: bool,
    }

    public fun new_observation(
        agent_id: ID,
        epoch: u64,
        palace_ref: vector<u8>,
    ): ObservationReport {
        ObservationReport { agent_id, role: ROLE_PROSKOPOS, epoch, palace_ref }
    }

    public fun new_proposal(
        agent_id: ID,
        epoch: u64,
        risk_score: u8,
        proposal_hash: vector<u8>,
    ): AnalystProposal {
        AnalystProposal { agent_id, role: ROLE_LOGISTES, epoch, risk_score, proposal_hash }
    }

    public fun new_verdict(
        agent_id: ID,
        epoch: u64,
        approved: bool,
        threshold_used: u8,
    ): GuardianVerdict {
        GuardianVerdict { agent_id, role: ROLE_PHYLAX, epoch, approved, threshold_used }
    }

    public fun new_executor_result(
        agent_id: ID,
        epoch: u64,
        tx_digest: vector<u8>,
        success: bool,
    ): ExecutorResult {
        ExecutorResult { agent_id, role: ROLE_PRAXISTES, epoch, tx_digest, success }
    }
}
