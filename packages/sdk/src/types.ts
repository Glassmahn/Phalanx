export const ROLES = {
  PROSKOPOS: 1,
  LOGISTES: 2,
  PRAXISTES: 3,
  PHYLAX: 4,
} as const;

export const ROLE_NAMES: Record<number, string> = {
  1: "proskopos",
  2: "logistes",
  3: "praxistes",
  4: "phylax",
};

export type RoleVariant = (typeof ROLES)[keyof typeof ROLES];

export interface AgentOnChain {
  id: string;
  role: number;
  personal_blob_id: number[];
}

export interface PhalanxOnChain {
  id: string;
  commander: string;
  agents: string[];
  palace_blob_id: number[];
  guardian_threshold: number;
  created_at: number;
}

export interface Locus {
  index: number;
  agent_role: string;
  agent_id: string;
  phase: LocusPhase;
  content: Record<string, unknown>;
  timestamp: number;
  epoch: number;
  previous_locus_hash: string;
  signature: string;
}

export type LocusPhase =
  | "gathering"
  | "reasoning"
  | "safety"
  | "executing"
  | "memory_write";

export interface CoordInstruction {
  intent: string;
  phalanxId: string;
}

export interface ApprovalRequest {
  id: string;
  phalanxId: string;
  proposal: AnalystProposal;
  riskScore: number;
  threshold: number;
  status: "pending" | "approved" | "denied";
  createdAt: number;
}

export interface ObservationReport {
  agentId: string;
  source: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface AnalystProposal {
  agentId: string;
  action: string;
  targetProtocol: string;
  params: Record<string, unknown>;
  riskScore: number;
  reasoning: string;
  expectedYield?: number;
}

export interface GuardianVerdict {
  agentId: string;
  approved: boolean;
  riskScore: number;
  threshold: number;
  reason: string;
}

export interface ExecutorResult {
  agentId: string;
  txDigest: string;
  success: boolean;
  gasUsed: number;
}

export interface FormationState {
  phalanx: PhalanxOnChain;
  palaceLoci: Locus[];
  currentPhase: LocusPhase;
  pendingApproval: ApprovalRequest | null;
}

export interface SuiEventData {
  id: { txDigest: string; eventSeq: string };
  packageId: string;
  transactionModule: string;
  sender: string;
  type: string;
  parsedJson: Record<string, unknown>;
  timestampMs?: number;
}
