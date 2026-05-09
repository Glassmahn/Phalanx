import type { ApprovalRequest } from "@phalanx/sdk";

interface Props {
  request: ApprovalRequest;
  onApprove: (id: string) => void;
  onDeny: (id: string) => void;
}

export function ApprovalPanel({ request, onApprove, onDeny }: Props) {
  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: 8,
        border: "2px solid #ffa500",
        background: "#1a1500",
        marginBottom: "1.5rem",
      }}
    >
      <h2 style={{ margin: "0 0 0.5rem", color: "#ffa500" }}>
        Action Requires Approval
      </h2>

      <div style={{ marginBottom: "1rem" }}>
        <p>
          <strong>Risk Score:</strong>{" "}
          <span
            style={{
              color: request.riskScore >= 7 ? "#ff4444" : "#ffa500",
            }}
          >
            {request.riskScore}/10
          </span>
          {" | "}
          <strong>Threshold:</strong> {request.threshold}/10
        </p>
        <p>
          <strong>Proposal:</strong>{" "}
          {JSON.stringify(request.proposal?.action ?? "unknown")}
        </p>
        {request.proposal?.reasoning && (
          <p style={{ fontSize: "0.9rem", color: "#ccc" }}>
            {request.proposal.reasoning}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={() => onApprove(request.id)}
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: 6,
            border: "none",
            background: "#2a6e2a",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Approve
        </button>
        <button
          onClick={() => onDeny(request.id)}
          style={{
            padding: "0.6rem 1.5rem",
            borderRadius: 6,
            border: "none",
            background: "#6e2a2a",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Deny
        </button>
      </div>
    </div>
  );
}
