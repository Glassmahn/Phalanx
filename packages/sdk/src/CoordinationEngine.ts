import { EventEmitter } from "events";
import { Signer } from "@mysten/sui/cryptography";
import { PhalanxClient } from "./PhalanxClient";
import { WalrusClient } from "./WalrusClient";
import { AgentRuntime } from "./AgentRuntime";
import type {
  Locus,
  LocusPhase,
  FormationState,
  PhalanxOnChain,
  ApprovalRequest,
} from "./types";

export type CoordPhase =
  | "idle"
  | "gathering"
  | "reasoning"
  | "safety"
  | "awaiting_approval"
  | "executing"
  | "memory_write"
  | "error";

export interface CoordEventMap {
  phaseChange: (phase: CoordPhase) => void;
  observation: (data: Record<string, unknown>) => void;
  proposal: (data: Record<string, unknown>) => void;
  verdict: (data: Record<string, unknown>) => void;
  approvalNeeded: (request: ApprovalRequest) => void;
  execution: (data: Record<string, unknown>) => void;
  memoryWritten: (blobId: string) => void;
  error: (err: Error) => void;
  stateChange: (state: FormationState) => void;
}

export class CoordinationEngine {
  private emitter = new EventEmitter();
  private phalanxClient: PhalanxClient;
  private walrusClient: WalrusClient;
  private agents: Map<string, AgentRuntime>;
  private signer: Signer;
  private phalanxId: string;

  private phase: CoordPhase = "idle";
  private loci: Locus[] = [];
  private currentPhalanx: PhalanxOnChain | null = null;
  private pendingApproval: ApprovalRequest | null = null;
  private lastBlobId: string = "";

  constructor(
    phalanxClient: PhalanxClient,
    walrusClient: WalrusClient,
    phalanxId: string,
    agents: Map<string, AgentRuntime>,
    signer: Signer
  ) {
    this.phalanxClient = phalanxClient;
    this.walrusClient = walrusClient;
    this.phalanxId = phalanxId;
    this.agents = agents;
    this.signer = signer;
  }

  on<K extends keyof CoordEventMap>(
    event: K,
    listener: CoordEventMap[K]
  ): void {
    this.emitter.on(event, listener as (...args: unknown[]) => void);
  }

  private emit<K extends keyof CoordEventMap>(
    event: K,
    ...args: Parameters<CoordEventMap[K]>
  ): void {
    this.emitter.emit(event, ...(args as unknown[]));
  }

  private setPhase(phase: CoordPhase): void {
    this.phase = phase;
    this.emit("phaseChange", phase);
    this.emitFormationState();
  }

  private async loadPhalanx(): Promise<void> {
    this.currentPhalanx = await this.phalanxClient.getPhalanx(this.phalanxId);
  }

  private async loadPalace(): Promise<void> {
    if (!this.currentPhalanx) await this.loadPhalanx();
    const blobIdBytes = this.currentPhalanx!.palace_blob_id;
    if (blobIdBytes.length === 0) {
      this.loci = [];
      return;
    }
    const blobId = new TextDecoder().decode(new Uint8Array(blobIdBytes));
    this.loci = await this.walrusClient.readPalace(blobId);
  }

  private emitFormationState(): void {
    const state: FormationState = {
      phalanx: this.currentPhalanx!,
      palaceLoci: this.loci,
      currentPhase: this.getCurrentLocusPhase(),
      pendingApproval: this.pendingApproval,
    };
    this.emit("stateChange", state);
  }

  private getCurrentLocusPhase(): LocusPhase {
    switch (this.phase) {
      case "gathering":
        return "gathering";
      case "reasoning":
        return "reasoning";
      case "safety":
      case "awaiting_approval":
        return "safety";
      case "executing":
        return "executing";
      case "memory_write":
        return "memory_write";
      default:
        return "gathering";
    }
  }

  private async writeLocus(
    role: string,
    phase: LocusPhase,
    content: Record<string, unknown>
  ): Promise<void> {
    const newLocus = this.walrusClient.makeLocus(
      role,
      this.phalanxId,
      phase,
      content,
      this.currentPhalanx?.created_at ?? 0
    );

    const existingBlobId =
      this.currentPhalanx?.palace_blob_id.length
        ? new TextDecoder().decode(new Uint8Array(this.currentPhalanx!.palace_blob_id))
        : null;

    const { loci, blobId } = await this.walrusClient.appendLocus(
      existingBlobId,
      newLocus
    );
    this.loci = loci;

    this.lastBlobId = blobId;
    await this.phalanxClient.updatePalace(
      this.phalanxId,
      new TextEncoder().encode(blobId),
      this.signer
    );
  }

  async submitIntent(instruction: string): Promise<void> {
    try {
      await this.loadPhalanx();
      await this.loadPalace();

      // Phase 1: GATHERING — Proskopos
      this.setPhase("gathering");
      const scout = this.agents.get("proskopos");
      if (!scout) throw new Error("Scout (proskopos) not registered");

      const observation = await scout.think({ palaceLoci: this.loci, instruction });
      this.emit("observation", observation);
      await this.writeLocus("proskopos", "gathering", observation);

      // Phase 2: REASONING — Logistes
      this.setPhase("reasoning");
      const analyst = this.agents.get("logistes");
      if (!analyst) throw new Error("Analyst (logistes) not registered");

      const proposal = await analyst.think({
        palaceLoci: this.loci,
        instruction,
        extra: { observations: observation },
      });
      this.emit("proposal", proposal);
      await this.writeLocus("logistes", "reasoning", proposal);

      // Phase 3: SAFETY — Phylax
      this.setPhase("safety");
      const guardian = this.agents.get("phylax");
      if (!guardian) throw new Error("Guardian (phylax) not registered");

      const verdict = await guardian.think({
        palaceLoci: this.loci,
        instruction,
        extra: {
          proposal,
          guardian_threshold: this.currentPhalanx!.guardian_threshold,
        },
      });
      this.emit("verdict", verdict);
      await this.writeLocus("phylax", "safety", verdict);

      const approved = verdict.approved === true;
      const autoApproved = verdict.auto_approved === true;

      if (approved && autoApproved) {
        await this.executeAction(proposal, instruction);
      } else {
        this.setPhase("awaiting_approval");
        const request: ApprovalRequest = {
          id: crypto.randomUUID(),
          phalanxId: this.phalanxId,
          proposal: proposal as any,
          riskScore: (verdict.risk_score as number) ?? 5,
          threshold: this.currentPhalanx!.guardian_threshold,
          status: "pending",
          createdAt: Date.now(),
        };
        this.pendingApproval = request;
        this.emit("approvalNeeded", request);
        this.emitFormationState();
      }
    } catch (err) {
      this.setPhase("error");
      this.emit("error", err instanceof Error ? err : new Error(String(err)));
    }
  }

  async approveAction(approvalId: string): Promise<void> {
    if (this.pendingApproval?.id !== approvalId) {
      throw new Error(`No pending approval matching ${approvalId}`);
    }
    this.pendingApproval.status = "approved";
    await this.executeAction(this.pendingApproval.proposal as any, "approved by human");
  }

  async denyAction(approvalId: string): Promise<void> {
    if (this.pendingApproval?.id !== approvalId) {
      throw new Error(`No pending approval matching ${approvalId}`);
    }
    this.pendingApproval.status = "denied";
    await this.writeLocus("phylax", "safety", {
      approved: false,
      reason: "denied by human",
    });
    this.pendingApproval = null;
    this.setPhase("idle");
  }

  private async executeAction(
    proposal: Record<string, unknown>,
    instruction: string
  ): Promise<void> {
    this.setPhase("executing");
    const executor = this.agents.get("praxistes");
    if (!executor) throw new Error("Executor (praxistes) not registered");

    const execution = await executor.think({
      palaceLoci: this.loci,
      instruction,
      extra: { proposal },
    });
    this.emit("execution", execution);

    this.setPhase("memory_write");
    await this.writeLocus("praxistes", "executing", execution);

    this.emit("memoryWritten", this.lastBlobId);
    this.pendingApproval = null;
    this.setPhase("idle");
  }

  getPhase(): CoordPhase {
    return this.phase;
  }

  getState(): FormationState {
    return {
      phalanx: this.currentPhalanx!,
      palaceLoci: this.loci,
      currentPhase: this.getCurrentLocusPhase(),
      pendingApproval: this.pendingApproval,
    };
  }
}
