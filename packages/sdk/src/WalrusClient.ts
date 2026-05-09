import { createHash } from "crypto";
import type { Locus, LocusPhase } from "./types";

interface WalrusStoreResponse {
  newlyCreated?: {
    blobObject: {
      id: string;
    };
    blobId: string;
  };
  alreadyCertified?: {
    blobId: string;
  };
}

export class WalrusClient {
  private publisherUrl: string;
  private aggregatorUrl: string;

  constructor(publisherUrl: string, aggregatorUrl: string) {
    this.publisherUrl = publisherUrl;
    this.aggregatorUrl = aggregatorUrl;
  }

  async writePalace(loci: Locus[]): Promise<string> {
    const blob = new TextEncoder().encode(JSON.stringify(loci));
    const response = await fetch(`${this.publisherUrl}/v1/store`, {
      method: "PUT",
      body: blob,
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Walrus store failed: ${response.status}`);
    }

    const result: WalrusStoreResponse = await response.json();
    const blobId =
      result.newlyCreated?.blobId ?? result.alreadyCertified?.blobId;
    if (!blobId) throw new Error("Walrus store returned no blobId");

    return blobId;
  }

  async readPalace(blobId: string): Promise<Locus[]> {
    const response = await fetch(
      `${this.aggregatorUrl}/v1/${blobId}`
    );

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Walrus read failed: ${response.status}`);
    }

    const text = await response.text();
    return JSON.parse(text) as Locus[];
  }

  async appendLocus(
    existingBlobId: string | null,
    newLocus: Omit<Locus, "index" | "previous_locus_hash" | "signature">
  ): Promise<{ loci: Locus[]; blobId: string }> {
    const existing = existingBlobId
      ? await this.readPalace(existingBlobId)
      : [];

    const previousHash = existingBlobId
      ? this.hashBlobId(existingBlobId)
      : "0".repeat(64);

    const locus: Locus = {
      ...newLocus,
      index: existing.length,
      previous_locus_hash: previousHash,
      signature: "", // TODO: add cryptographic signing post-MVP
    };

    const loci = [...existing, locus];
    const blobId = await this.writePalace(loci);

    return { loci, blobId };
  }

  verifyChain(loci: Locus[]): boolean {
    if (loci.length === 0) return true;
    if (loci[0].previous_locus_hash !== "0".repeat(64)) return false;

    for (let i = 1; i < loci.length; i++) {
      const expectedHash = this.hashLocusIndex(i - 1, loci);
      if (loci[i].previous_locus_hash !== expectedHash) {
        return false;
      }
    }

    return true;
  }

  private hashBlobId(blobId: string): string {
    return createHash("sha256").update(blobId).digest("hex");
  }

  private hashLocusIndex(index: number, loci: Locus[]): string {
    const locus = loci[index];
    const serialized = JSON.stringify(locus);
    return createHash("sha256").update(serialized).digest("hex");
  }

  makeLocus(
    agentRole: string,
    agentId: string,
    phase: LocusPhase,
    content: Record<string, unknown>,
    epoch: number
  ): Omit<Locus, "index" | "previous_locus_hash" | "signature"> {
    return {
      agent_role: agentRole,
      agent_id: agentId,
      phase,
      content,
      timestamp: Date.now(),
      epoch,
    };
  }
}
