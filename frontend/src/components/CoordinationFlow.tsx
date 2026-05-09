interface Props {
  phase: string;
}

const phases = [
  { id: "gathering", label: "Gathering" },
  { id: "reasoning", label: "Reasoning" },
  { id: "safety", label: "Safety" },
  { id: "executing", label: "Executing" },
  { id: "memory_write", label: "Memory" },
];

export function CoordinationFlow({ phase }: Props) {
  const activeIndex = phases.findIndex((p) => p.id === phase);

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        alignItems: "center",
        marginBottom: "1.5rem",
      }}
    >
      {phases.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              fontSize: "0.85rem",
              fontWeight: 600,
              background:
                i === activeIndex
                  ? "#4a9eff"
                  : i < activeIndex
                    ? "#2a6e2a"
                    : "#222",
              color: i <= activeIndex ? "#fff" : "#666",
              transition: "all 0.3s",
            }}
          >
            {p.label}
          </div>
          {i < phases.length - 1 && (
            <div
              style={{
                width: 16,
                height: 2,
                background: i < activeIndex ? "#2a6e2a" : "#333",
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
