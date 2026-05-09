import { ConnectButton } from "@mysten/dapp-kit";
import { useRouter } from "next/router";
import styles from "../styles/Home.module.css";

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>PHALANX</h1>
        <p className={styles.tagline}>
          Your unbreakable swarm of autonomous AI agents.
          <br />
          Shields locked. One intent. Coordinated execution.
        </p>
        <ConnectButton />
      </header>

      <section className={styles.story}>
        <p>
          In ancient Greece, the phalanx was history's most feared formation:
          hoplites standing shoulder-to-shoulder, shields locked into an
          unbreakable wall, spears striking as one. No single warrior could win
          the battle — only perfect coordination turned them into an unstoppable
          force.
        </p>
        <p>
          Phalanx brings that legend on-chain. A marketplace of ownable AI
          agents that live as Sui objects, share a collective memory palace on
          Walrus, and coordinate in real time to execute complex workflows.
        </p>
      </section>

      <section className={styles.agents}>
        <h2>Your Formation</h2>
        <div className={styles.grid}>
          <div className={styles.card}>
            <h3>Proskopos</h3>
            <p className={styles.role}>Scout</p>
            <p>Market scanning, liquidity checks, opportunity detection</p>
          </div>
          <div className={styles.card}>
            <h3>Logistes</h3>
            <p className={styles.role}>Analyst</p>
            <p>Risk scoring, strategy simulation, proposal generation</p>
          </div>
          <div className={styles.card}>
            <h3>Phylax</h3>
            <p className={styles.role}>Guardian</p>
            <p>Safety checks, scam detection, veto authority</p>
          </div>
          <div className={styles.card}>
            <h3>Praxistes</h3>
            <p className={styles.role}>Executor</p>
            <p>Atomic transaction bundles on DeepBook</p>
          </div>
        </div>
      </section>

      <div className={styles.cta}>
        <button onClick={() => router.push("/dashboard")}>
          Enter the Phalanx
        </button>
      </div>
    </div>
  );
}
