import { Link } from "react-router-dom";
import {
  BriefingHeader,
  DigestTristat,
  LiveStatus,
  Icon,
  SignalCard,
  Queue,
  ActionButton,
  SaveWindow,
  Mono,
  MetricCard,
  Delta,
  QuickWinsChecklist,
} from "@/gocsm-ds";
import { header, digest, signals, type BriefingSignal, vitals, isNewAgency, coldStart } from "./briefing.fixtures";

function greetingFor(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}.`;
}

// ─── Layer 1: Verdict ─────────────────────────────────────────────────────────
function VerdictLayer() {
  const handleWaiting = () => {
    const el = document.getElementById("briefing-queue");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section aria-label="Verdict" className="flex flex-col gap-4">
      <BriefingHeader
        greeting={`${greetingFor(header.ownerName)} Here's what GoCSM did overnight, and what needs you today.`}
        sync={<LiveStatus state="fresh" label={`Synced ${header.lastSync}`} />}
      />
      <DigestTristat
        sent={digest.sent}
        alerted={digest.alerted}
        waiting={digest.waiting}
        line={digest.line}
        onWaiting={handleWaiting}
      />
      <div>
        <Link
          to="/activity"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--s-1)",
            color: "var(--text-3, var(--text))",
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          See activity log <Icon name="arrow-right" />
        </Link>
      </div>
    </section>
  );
}

// ─── Layer 2: Action / Queue ──────────────────────────────────────────────────
function FactorPeek({ signal }: { signal: BriefingSignal }) {
  return (
    <details
      style={{
        display: "inline-block",
        fontSize: 12,
        color: "var(--text-3, var(--text))",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--s-1)",
        }}
      >
        Evidence <Icon name="chevron-down" />
      </summary>
      <ul
        style={{
          margin: "var(--s-2) 0 0",
          paddingLeft: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-1)",
        }}
      >
        {signal.factors.map((f, i) => (
          <li key={i}>{f.text}</li>
        ))}
      </ul>
    </details>
  );
}

function ActionLayer() {
  return (
    <section
      id="briefing-queue"
      aria-label="Action"
      className="flex flex-col gap-3"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-lg" style={{ color: "var(--text)", margin: 0 }}>
          <Mono>{signals.length}</Mono> customers need you today.
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--text-3, var(--text))", margin: 0 }}
        >
          GoCSM tried what it could — these need a human.
        </p>
      </header>

      <Queue>
        {signals.map((s) => (
          <SignalCard
            key={s.id}
            band={s.band}
            account={s.account}
            mrr={s.mrr}
            story={s.story}
            conf={s.conf}
            confDetail={s.confDetail}
            saveWindow={s.saveWindow ? <SaveWindow>{s.saveWindow}</SaveWindow> : null}
            provenance={<FactorPeek signal={s} />}
            onSeePlaybook={() => {}}
            action={<ActionButton>{s.actionLabel}</ActionButton>}
          />
        ))}
      </Queue>
    </section>
  );
}

export default function Briefing() {
  return (
    <div className="flex flex-col gap-8">
      <VerdictLayer />
      <ActionLayer />
    </div>
  );
}
