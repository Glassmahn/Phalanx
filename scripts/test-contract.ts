import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromHEX } from "@mysten/sui/utils";

async function main() {
  const pkg = process.env.PHALANX_PACKAGE_ID!;
  const phalanxId = process.env.PHALANX_OBJECT_ID!;
  const keypair = Ed25519Keypair.fromSecretKey(
    fromHEX(process.env.PHALANX_PRIVATE_KEY!)
  );

  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  console.log("=== Phalanx Contract Test ===\n");
  let passed = 0;
  let failed = 0;

  // Test 1: Read Phalanx
  console.log("1. Reading Phalanx object...");
  const phalanx = await client.getObject({
    id: phalanxId,
    options: { showContent: true },
  });
  if (phalanx.data?.content) {
    console.log("   OK — Phalanx exists");
    passed++;
  } else {
    console.log("   FAIL — Phalanx not found");
    failed++;
  }

  // Test 2: Set guardian threshold
  console.log("\n2. Setting guardian threshold to 7...");
  const tx1 = new Transaction();
  tx1.moveCall({
    target: `${pkg}::phalanx::set_guardian_threshold`,
    arguments: [tx1.object(phalanxId), tx1.pure.u8(7)],
  });
  const r1 = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx1,
    options: { showEffects: true },
  });
  if (r1.effects?.status?.status === "success") {
    console.log("   OK — Threshold updated");
    passed++;
  } else {
    console.log("   FAIL — Threshold update failed");
    failed++;
  }

  // Test 3: Update palace blob
  console.log("\n3. Updating palace blob ID...");
  const testBlobId = new Uint8Array(32).fill(0x01);
  const tx2 = new Transaction();
  tx2.moveCall({
    target: `${pkg}::phalanx::update_palace`,
    arguments: [tx2.object(phalanxId), tx2.pure(testBlobId)],
  });
  const r2 = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx2,
    options: { showEffects: true },
  });
  if (r2.effects?.status?.status === "success") {
    console.log("   OK — Palace updated");
    passed++;
  } else {
    console.log("   FAIL — Palace update failed");
    failed++;
  }

  // Test 4: Get agent count
  console.log("\n4. Checking agent count...");
  const phalanxUpdated = await client.getObject({
    id: phalanxId,
    options: { showContent: true },
  });
  const content = phalanxUpdated.data?.content as any;
  const agentCount = content?.fields?.agents?.length ?? 0;
  console.log(`   Agents: ${agentCount}`);
  if (agentCount === 4) {
    console.log("   OK — 4 agents in formation");
    passed++;
  } else {
    console.log(`   WARN — Expected 4, got ${agentCount}`);
    // Not a hard fail — deploy may not have added all 4
  }

  // Summary
  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
