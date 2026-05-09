import { useEffect, useState } from "react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useRouter } from "next/router";
import { CommandInput } from "../components/CommandInput";
import { CoordinationFlow } from "../components/CoordinationFlow";
import { AgentCard } from "../components/AgentCard";
import { ApprovalPanel } from "../components/ApprovalPanel";
import { PalaceTimeline } from "../components/PalaceTimeline";
import type { FormationState } from "@phalanx/sdk";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function Dashboard() {
  const account = useCurrentAccount();
  const router = useRouter();
  const [state, setState] = useState<FormationState | null>(null);
  const [phase, setPhase] = useState("idle");

  useEffect(() => {
    if (!account) {
      router.push("/");
      return;
    }

    const events = new EventSource(`${API}/api/events`);
    events.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setState(data);
    };

    return () => events.close();
  }, [account, router]);

  const submitIntent = async (intent: string) => {
    await fetch(`${API}/api/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent }),
    });
  };

  const handleApprove = async (id: string) => {
    await fetch(`${API}/api/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId: id }),
    });
  };

  const handleDeny = async (id: string) => {
    await fetch(`${API}/api/deny`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approvalId: id }),
    });
  };

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
        <h1 style={{ margin: 0 }}>PHALANX</h1>
        <ConnectButton />
      </header>

      <CommandInput onSubmit={submitIntent} />

      <CoordinationFlow phase={phase} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
          margin: "2rem 0",
        }}
      >
        <AgentCard name="Proskopos" role="Scout" state={state} />
        <AgentCard name="Logistes" role="Analyst" state={state} />
        <AgentCard name="Phylax" role="Guardian" state={state} />
        <AgentCard name="Praxistes" role="Executor" state={state} />
      </div>

      {state?.pendingApproval && (
        <ApprovalPanel
          request={state.pendingApproval}
          onApprove={handleApprove}
          onDeny={handleDeny}
        />
      )}

      {state && <PalaceTimeline loci={state.palaceLoci} />}
    </div>
  );
}
