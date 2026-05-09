import { useEffect, useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/router";
import { PalaceTimeline } from "../components/PalaceTimeline";
import type { FormationState } from "@phalanx/sdk";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function PalacePage() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [state, setState] = useState<FormationState | null>(null);

  useEffect(() => {
    if (!account) {
      router.push("/");
      return;
    }

    const phalanxId = new URLSearchParams(window.location.search).get("id");
    if (phalanxId) {
      fetch(`${API}/api/phalanx/${phalanxId}`)
        .then((r) => r.json())
        .then(setState);
    }
  }, [account, router]);

  if (!account) return null;

  return (
    <div style={{ padding: "2rem", maxWidth: 1200, margin: "0 auto" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1 style={{ margin: 0 }}>Memory Palace</h1>
        <ConnectButton />
      </header>

      {state ? (
        <PalaceTimeline loci={state.palaceLoci} />
      ) : (
        <p>Connect wallet and provide a Phalanx ID to view the palace.</p>
      )}
    </div>
  );
}
