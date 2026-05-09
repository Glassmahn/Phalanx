import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHEX } from "@mysten/sui/utils";

import { PhalanxClient } from "@phalanx/sdk";
import { WalrusClient } from "@phalanx/sdk";
import { AgentRuntime } from "@phalanx/sdk";
import { CoordinationEngine } from "@phalanx/sdk";

import { join } from "path";

export function createEngine(): CoordinationEngine {
  const phalanxId = process.env.PHALANX_OBJECT_ID!;
  const packageId = process.env.PHALANX_PACKAGE_ID!;
  const privateKey = process.env.PHALANX_PRIVATE_KEY!;
  const apiKey = process.env.OPENAI_API_KEY!;

  const keypair = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  const phalanxClient = new PhalanxClient(client, packageId);
  const walrusClient = new WalrusClient(
    process.env.WALRUS_PUBLISHER_URL!,
    process.env.WALRUS_AGGREGATOR_URL!
  );

  const promptsDir = join(__dirname, "../../packages/prompts");

  const agents = new Map<string, AgentRuntime>();
  agents.set("proskopos", new AgentRuntime("proskopos", promptsDir, apiKey));
  agents.set("logistes", new AgentRuntime("logistes", promptsDir, apiKey));
  agents.set("phylax", new AgentRuntime("phylax", promptsDir, apiKey));
  agents.set("praxistes", new AgentRuntime("praxistes", promptsDir, apiKey));

  const engine = new CoordinationEngine(
    phalanxClient,
    walrusClient,
    phalanxId,
    agents,
    keypair
  );

  engine.on("error", (err: Error) => console.error("[Coord]", err));
  engine.on("phaseChange", (phase: string) => console.log("[Coord] Phase:", phase));
  engine.on("memoryWritten", (blobId: string) => console.log("[Coord] Palace blob:", blobId));

  return engine;
}
