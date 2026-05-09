# PHALANX

> Your unbreakable swarm of autonomous AI agents. Shields locked. One intent. Coordinated execution.

---

## Storyline

In ancient Greece, the phalanx was history's most feared formation: hoplites standing shoulder-to-shoulder, shields locked into an unbreakable wall, spears striking as one. No single warrior could win the battle — only perfect coordination turned them into an unstoppable force.

Phalanx brings that legend on-chain. A marketplace of ownable AI agents that live as Sui objects, share a collective memory palace on Walrus, and coordinate in real time to execute complex workflows. One natural-language command becomes a full tactical operation — while you stay in full control.

## One-Liner

> Phalanx is a marketplace of autonomous, ownable AI agents that coordinate as a Sui-object swarm and share a Walrus memory palace to complete multi-step DeFi, research, and coordination tasks at lightning speed.

---

## Architecture

Phalanx is three layers:

| Layer | Technology | Role |
|---|---|---|
| Ownership | Sui Move (testnet) | Phalanx object, Agent objects, on-chain events, Guardian thresholds |
| Memory | Walrus (testnet) | Shared memory palace — append-only locus chain with cryptographic proofs |
| Intelligence | OpenAI (GPT-4o-mini) | 4 agent runtimes (Scout, Analyst, Guardian, Executor) coordinated by a state machine |

### Agent Formation

| Role | Name | Function |
|---|---|---|
| Proskopos | Scout | Market scanning, liquidity checks, on-chain observations |
| Logistes | Analyst | Risk scoring, strategy simulation, proposal generation |
| Phylax | Guardian | Safety checks, threshold enforcement, veto authority |
| Praxistes | Executor | Atomic transaction execution via DeepBook |

### Coordination Flow

```
User Intent → GATHERING (Scout) → REASONING (Analyst) → SAFETY (Guardian + Human) → EXECUTING (Executor) → MEMORY (Walrus)
```

---

## Repo Structure

```
phalanx/
├── move/                  # Sui Move package
│   ├── sources/
│   │   ├── agent.move     # Agent struct, Role enum, creation
│   │   ├── events.move    # On-chain event types
│   │   └── phalanx.move   # Phalanx object, agent management, thresholds
│   ├── tests/
│   └── Move.toml
├── packages/
│   ├── sdk/               # TypeScript SDK (PhalanxClient, WalrusClient, AgentRuntime, CoordinationEngine)
│   └── prompts/           # System prompt files for each agent role
├── backend/               # Express server + coordination glue
├── frontend/              # Next.js dashboard with Sui wallet connect
├── scripts/               # deploy.ts, test-contract.ts, demo.ts
├── .env.example
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- [Sui CLI](https://docs.sui.io/guides/developer/getting-started/sui-install)
- [Sui Testnet Tokens](https://faucet.sui.io)
- OpenAI API key (or Grok)

### Environment

```bash
cp .env.example .env
# Fill in: PHALANX_PRIVATE_KEY, OPENAI_API_KEY, WALRUS_*
```

### Deploy Move Contracts

```bash
npm run move:build
npm run move:publish
```

This creates the Phalanx object + 4 starter agents on testnet.

### Start Backend

```bash
npm run backend:dev
```

Runs on `http://localhost:3001`.

### Start Frontend

```bash
npm run frontend:dev
```

Opens `http://localhost:3000`.

### Run Demo

```bash
npm run demo
```

Automated end-to-end "optimize my yield" swarm run.

---

## API

| Endpoint | Method | Description |
|---|---|---|
| `/api/intent` | POST | Submit natural language command |
| `/api/phalanx/:id` | GET | Read Phalanx + palace state |
| `/api/events` | GET | SSE stream of formation state changes |
| `/api/approve` | POST | Approve a pending action |
| `/api/deny` | POST | Deny a pending action |
| `/api/health` | GET | Server health + current phase |

---

## Tech Stack

- **Blockchain**: Sui (testnet) via `@mysten/sui`
- **Memory**: Walrus (testnet) — content-addressed blob storage
- **Agents**: OpenAI GPT-4o-mini with structured JSON output
- **Frontend**: Next.js 14 + `@mysten/dapp-kit`
- **Backend**: Express + TypeScript

---

## License

MIT
