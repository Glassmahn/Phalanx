/**
 * Phalanx Demo — "Optimize my yield" end-to-end swarm run
 *
 * Usage: tsx scripts/demo.ts
 * Requires: .env with PHALANX_PACKAGE_ID, PHALANX_OBJECT_ID, PHALANX_PRIVATE_KEY, OPENAI_API_KEY
 */

import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromHEX } from "@mysten/sui/utils";
import { PhalanxClient, WalrusClient, AgentRuntime, CoordinationEngine } from "@phalanx/sdk";
import { join } from "path";
import { readFileSync } from "fs";

function loadEnv() {
  const envPath = join(__dirname, "..", ".env");
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) {
      process.env[key.trim()] = rest.join("=").trim();
    }
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  loadEnv();

  const packageId = process.env.PHALANX_PACKAGE_ID!;
  const phalanxId = process.env.PHALANX_OBJECT_ID!;
  const privateKey = process.env.PHALANX_PRIVATE_KEY!;
  const apiKey = process.env.OPENAI_API_KEY!;

  const keypair = Ed25519Keypair.fromSecretKey(fromHEX(privateKey));
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  const phalanxClient = new PhalanxClient(client, packageId);
  const walrusClient = new WalrusClient(
    process.env.WALRUS_PUBLISHER_URL!,
    process.env.WALRUS_AGGREGATOR_URL!
  );

  const promptsDir = join(__dirname, "..", "packages", "prompts");
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

  engine.on("phaseChange", (phase) => console.log(`[${phase.toUpperCase()}]`));
  engine.on("observation", (d) => console.log("  Scout observed:", (d as any).observations?.length ?? "?", "data points"));
  engine.on("proposal", (d) => console.log("  Analyst proposal. Risk score:", (d as any).risk_score));
  engine.on("verdict", (d) => console.log("  Guardian verdict:", (d as any).approved ? "APPROVED" : "BLOCKED", "(auto:", (d as any).auto_approved, ")"));
  engine.on("execution", (d) => console.log("  Executor result:", (d as any).success ? "SUCCESS" : "FAILED"));
  engine.on("memoryWritten", (id) => console.log("  Palace written:", id?.slice(0, 16) + "..."));
  engine.on("approvalNeeded", () => console.log("  AWAITING HUMAN APPROVAL"));

  console.log("=== Phalanx Demo ===\n");
  console.log("Phalanx ID:", phalanxId);
  console.log("Package ID:", packageId);
  console.log("");

  // Read initial state
  const initial = await phalanxClient.getPhalanx(phalanxId);
  console.log(`Commander: ${initial.commander}`);
  console.log(`Agents in formation: ${initial.agents.length}`);
  console.log(`Guardian threshold: ${initial.guardian_threshold}\n`);

  // Submit intent
  const intent = "Optimize my yield this week on Sui. Check DeepBook liquidity and recommend the best strategy.";
  console.log(`>>> "${intent}"\n`);

  engine.submitIntent(intent);

  // Wait for completion
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      console.log("\n[Timeout] Demo took too long. Check backend logs.");
      resolve();
    }, 120_000);

    engine.on("phaseChange", (phase) => {
      if (phase === "idle" || phase === "awaiting_approval" || phase === "error") {
        clearTimeout(timeout);
        setTimeout(resolve, 1000);
      }
    });
  });

  // Show final result
  const state = engine.getState();
  console.log("\n=== Demo Complete ===");
  console.log(`Phase: ${engine.getPhase()}`);
  console.log(`Palace entries: ${state.palaceLoci.length}`);
  console.log(`Pending approval: ${state.pendingApproval ? "YES" : "NO"}`);
  console.log("\nCheck dashboard or palace page to review.");
}

main().catch((err) => {
  console.error("Demo failed:", err);
  process.exit(1);
});
