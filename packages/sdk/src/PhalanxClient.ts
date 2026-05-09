import { SuiClient } from "@mysten/sui/client";
import { Transaction } from "@mysten/sui/transactions";
import { Signer } from "@mysten/sui/cryptography";
import type {
  PhalanxOnChain,
  AgentOnChain,
  SuiEventData,
} from "./types";

export class PhalanxClient {
  private client: SuiClient;
  private packageId: string;

  constructor(client: SuiClient, packageId: string) {
    this.client = client;
    this.packageId = packageId;
  }

  async getPhalanx(phalanxId: string): Promise<PhalanxOnChain> {
    const obj = await this.client.getObject({
      id: phalanxId,
      options: { showContent: true },
    });

    const fields = (obj.data?.content as any)?.fields;
    if (!fields) throw new Error(`Phalanx ${phalanxId} not found`);

    return {
      id: fields.id?.id ?? phalanxId,
      commander: fields.commander,
      agents: fields.agents ?? [],
      palace_blob_id: fields.palace_blob_id ?? [],
      guardian_threshold: fields.guardian_threshold ?? 5,
      created_at: Number(fields.created_at ?? 0),
    };
  }

  async getAgent(agentId: string): Promise<AgentOnChain> {
    const obj = await this.client.getObject({
      id: agentId,
      options: { showContent: true },
    });

    const fields = (obj.data?.content as any)?.fields;
    if (!fields) throw new Error(`Agent ${agentId} not found`);

    return {
      id: fields.id?.id ?? agentId,
      role: fields.role?.fields?.variant ?? fields.role,
      personal_blob_id: fields.personal_blob_id ?? [],
    };
  }

  async addAgent(
    phalanxId: string,
    roleVariant: number,
    signer: Signer
  ): Promise<string> {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::phalanx::add_agent`,
      arguments: [tx.object(phalanxId), tx.pure.u8(roleVariant)],
    });

    const result = await this.client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: { showEffects: true },
    });

    const created = result.effects?.created?.[0]?.reference?.objectId;
    if (!created) throw new Error("Agent creation failed");
    return created;
  }

  async removeAgent(
    phalanxId: string,
    agentId: string,
    signer: Signer
  ): Promise<void> {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::phalanx::remove_agent`,
      arguments: [tx.object(phalanxId), tx.pure.id(agentId)],
    });

    await this.client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: { showEffects: true },
    });
  }

  async updatePalace(
    phalanxId: string,
    blobId: Uint8Array,
    signer: Signer
  ): Promise<void> {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::phalanx::update_palace`,
      arguments: [tx.object(phalanxId), tx.pure(blobId)],
    });

    await this.client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: { showEffects: true },
    });
  }

  async setGuardianThreshold(
    phalanxId: string,
    threshold: number,
    signer: Signer
  ): Promise<void> {
    const tx = new Transaction();
    tx.moveCall({
      target: `${this.packageId}::phalanx::set_guardian_threshold`,
      arguments: [tx.object(phalanxId), tx.pure.u8(threshold)],
    });

    await this.client.signAndExecuteTransaction({
      signer,
      transaction: tx,
      options: { showEffects: true },
    });
  }

  async subscribeToEvents(
    phalanxId: string,
    onEvent: (event: SuiEventData) => void
  ): Promise<() => void> {
    const filter = {
      MoveEventType: `${this.packageId}::events::`,
    };

    const unsubscribe = await this.client.subscribeEvent({
      filter,
      onMessage(event) {
        const data: SuiEventData = {
          id: event.id,
          packageId: event.packageId,
          transactionModule: event.transactionModule,
          sender: event.sender,
          type: event.type,
          parsedJson: event.parsedJson as Record<string, unknown>,
          timestampMs: event.timestampMs ? Number(event.timestampMs) : undefined,
        };
        onEvent(data);
      },
    });

    return unsubscribe;
  }
}
