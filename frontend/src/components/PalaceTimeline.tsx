import type { Locus } from "@phalanx/sdk";

interface Props {
  loci: Locus[];
}

const phaseColors: Record<string, string> = {
  gathering: "#4a9eff",
  reasoning: "#9b59b6",
  safety: "#ffa500",
  executing: "#2a6e2a",
  memory_write: "#888",
};

export function PalaceTimeline({ loci }: Props) {
  if (!loci.length) {
    return (
      <div style={{ marginTop: "2rem", color: "#666" }}>
        <p>No memory loci yet. Submit a command to begin.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "2rem" }}>
      <h2 style={{ marginBottom: "1rem" }}>Memory Palace</h2>
      <div
        style={{
          maxHeight: 400,
          overflowY: "auto",
          border: "1px solid #333",
          borderRadius: 8,
          padding: "1rem",
          background: "#0a0a0a",
        }}
      >
        {[...loci].reverse().map((locus, i) => (
          <div
            key={locus.index}
            style={{
              display: "flex",
              gap: "1rem",
              padding: "0.6rem 0",
              borderBottom: i < loci.length - 1 ? "1px solid #222" : "none",
              fontSize: "0.85rem",
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: phaseColors[locus.phase] ?? "#666",
                marginTop: 4,
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.2rem" }}>
                <strong style={{ textTransform: "capitalize" }}>
                  {locus.agent_role}
                </strong>
                <span style={{ color: "#666" }}>{locus.phase}</span>
                <span style={{ color: "#555", marginLeft: "auto" }}>
                  {new Date(locus.timestamp).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: 0, color: "#999", fontSize: "0.8rem" }}>
                {JSON.stringify(locus.content).slice(0, 200)}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#555", marginTop: "0.5rem" }}>
        {loci.length} locus{loci.length !== 1 ? "i" : ""} written to Walrus palace
      </p>
    </div>
  );
}
