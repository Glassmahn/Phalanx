import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Transaction } from "@mysten/sui/transactions";
import { fromHEX } from "@mysten/sui/utils";

const ROLE_PROSKOPOS = 1;
const ROLE_LOGISTES = 2;
const ROLE_PRAXISTES = 3;
const ROLE_PHYLAX = 4;

async function main() {
  console.log("=== Phalanx Deploy ===\n");

  // 1. Keypair
  const privateKey = process.env.PHALANX_PRIVATE_KEY;
  const keypair = privateKey
    ? Ed25519Keypair.fromSecretKey(fromHEX(privateKey))
    : new Ed25519Keypair();
  const address = keypair.toSuiAddress();
  console.log(`Commander: ${address}\n`);

  // 2. Build Move package
  console.log("1. Building Move package...");
  execSync("sui move build --path move", { stdio: "inherit" });

  const publishResult = JSON.parse(
    execSync("sui move build --dump-bytecode-as-base64 --path move", { encoding: "utf-8" })
  );

  // 3. Connect to testnet
  const client = new SuiClient({ url: getFullnodeUrl("testnet") });

  // 4. Publish
  console.log("2. Publishing package...");
  const tx = new Transaction();
  const upgradeCap = tx.publish({
    modules: publishResult.modules,
    dependencies: publishResult.dependencies,
  });
  tx.transferObjects([upgradeCap], address);

  const result = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true },
  });

  if (result.effects?.status?.status !== "success") {
    throw new Error(`Publish failed: ${result.effects?.status?.error}`);
  }

  const packageId = result.effects?.created?.[0]?.reference?.objectId;
  console.log(`Package: ${packageId}\n`);

  // 5. Init Phalanx
  console.log("3. Initializing Phalanx...");
  const initTx = new Transaction();
  initTx.moveCall({
    target: `${packageId}::phalanx::init`,
    arguments: [],
  });

  const initResult = await client.signAndExecuteTransaction({
    signer: keypair,
    transaction: initTx,
    options: { showEffects: true },
  });

  const phalanxId = initResult.effects?.created?.[0]?.reference?.objectId;
  console.log(`Phalanx: ${phalanxId}\n`);

  // 6. Add 4 agents
  console.log("4. Adding agents...");
  for (const role of [ROLE_PROSKOPOS, ROLE_LOGISTES, ROLE_PRAXISTES, ROLE_PHYLAX]) {
    const addTx = new Transaction();
    addTx.moveCall({
      target: `${packageId}::phalanx::add_agent`,
      arguments: [addTx.object(phalanxId), addTx.pure.u8(role)],
    });

    const r = await client.signAndExecuteTransaction({
      signer: keypair,
      transaction: addTx,
      options: { showEffects: true },
    });
    console.log(`  Agent ${role} created`);
  }

  // 7. Summary
  console.log("\n=== Done ===");
  const summary = `PHALANX_PACKAGE_ID=${packageId}\nPHALANX_OBJECT_ID=${phalanxId}\nPHALANX_ADMIN_ADDRESS=${address}\n`;
  writeFileSync(".env.deployed", summary);
  console.log(`Saved to .env.deployed`);
}

main().catch(console.error);
