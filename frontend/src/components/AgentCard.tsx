import type { FormationState } from "@phalanx/sdk";

interface Props {
  name: string;
  role: string;
  state: FormationState | null;
}

export function AgentCard({ name, role, state }: Props) {
  const lastLocus = state?.palaceLoci
    ?.filter((l) => l.agent_role === name.toLowerCase())
    ?.at(-1);

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: 8,
        border: "1px solid #333",
        background: "#0d0d0d",
      }}
    >
      <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.1rem" }}>{name}</h3>
      <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#888" }}>
        {role}
      </p>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "#666" }}>
        {lastLocus
          ? `Last action: ${lastLocus.phase} @ ${new Date(lastLocus.timestamp).toLocaleTimeString()}`
          : "Awaiting orders"}
      </p>
    </div>
  );
}
