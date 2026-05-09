import { useState } from "react";

interface Props {
  onSubmit: (intent: string) => void;
}

export function CommandInput({ onSubmit }: Props) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim()) return;
    setLoading(true);
    await onSubmit(value);
    setValue("");
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "0.5rem",
        marginBottom: "1.5rem",
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Command the Phalanx... (e.g. 'Optimize my yield this week')"
        disabled={loading}
        style={{
          flex: 1,
          padding: "0.75rem 1rem",
          fontSize: "1rem",
          borderRadius: 8,
          border: "1px solid #444",
          background: "#111",
          color: "#fff",
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={loading || !value.trim()}
        style={{
          padding: "0.75rem 1.5rem",
          fontSize: "1rem",
          borderRadius: 8,
          border: "none",
          background: loading ? "#555" : "#4a9eff",
          color: "#fff",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}
