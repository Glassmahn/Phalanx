import express from "express";
import cors from "cors";
import { createEngine } from "./coordination";
import type { ApprovalRequest } from "@phalanx/sdk";

const app = express();
app.use(cors());
app.use(express.json());

const engine = createEngine();
const approvalRequests = new Map<string, ApprovalRequest>();

engine.on("approvalNeeded", (req: ApprovalRequest) => {
  approvalRequests.set(req.id, req);
  console.log("[Server] Approval needed:", req.id);
});

// SSE endpoint for real-time status
app.get("/api/events", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  const onState = (state: any) => {
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  };

  engine.on("stateChange", onState);
  req.on("close", () => engine.on("stateChange", onState)); // cleanup
});

// Submit a new intent
app.post("/api/intent", async (req, res) => {
  const { intent } = req.body;
  if (!intent || typeof intent !== "string") {
    res.status(400).json({ error: "Missing intent field" });
    return;
  }

  engine.submitIntent(intent).catch((err) => {
    console.error("[Server] submitIntent error:", err);
  });

  res.json({ status: "accepted", intent });
});

// Get current formation state
app.get("/api/phalanx/:id", async (req, res) => {
  try {
    const state = engine.getState();
    res.json(state);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// Approve a pending action
app.post("/api/approve", async (req, res) => {
  const { approvalId } = req.body;
  if (!approvalId) {
    res.status(400).json({ error: "Missing approvalId" });
    return;
  }

  try {
    await engine.approveAction(approvalId);
    approvalRequests.delete(approvalId);
    res.json({ status: "approved" });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// Deny a pending action
app.post("/api/deny", async (req, res) => {
  const { approvalId } = req.body;
  if (!approvalId) {
    res.status(400).json({ error: "Missing approvalId" });
    return;
  }

  try {
    await engine.denyAction(approvalId);
    approvalRequests.delete(approvalId);
    res.json({ status: "denied" });
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", phase: engine.getPhase() });
});

const PORT = process.env.PORT ?? 3001;
app.listen(PORT, () => {
  console.log(`Phalanx backend running on :${PORT}`);
});
