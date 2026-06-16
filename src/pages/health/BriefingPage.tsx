import { useRef, useState } from "react";
import { briefingFixtures, type BriefingMode } from "./briefing.fixtures";
import {
  BriefingHeader,
  DigestTristat,
  LiveStatus,
  Icon,
  SignalCard,
  Queue,
  ActionButton,
  SaveWindow,
  ProvenanceExpander,
  Mono,
} from "@/gocsm-ds";


function greetingFor(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return `${part}, ${name}.`;
}

function Layer1Verdict({ onWaitingClick }: { mode: BriefingMode; onWaitingClick: () => void }) {
  const f = briefingFixtures;
  const greeting = greetingFor(f.header.ownerName);
  const promise = "Here's what GoCSM did overnight, and what needs you today.";

  return (
    <section data-layer="1-verdict" className="space-y-4">
      <BriefingHeader
        greeting={greeting}
        promise={promise}
        sync={<LiveStatus state="fresh" label={`Synced ${f.header.lastSync}`} />}
      />
      <DigestTristat
        line={f.digest.line}
        sent={f.digest.sent}
        alerted={f.digest.alerted}
        waiting={f.digest.waiting}
        onWaiting={onWaitingClick}
      />
      <div>
        <a href="/activity" className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:underline">
          See activity log <Icon name="arrow-right" />
        </a>
      </div>
    </section>
  );
}


function Layer2Action({ mode }: { mode: BriefingMode }) {
  const f = briefingFixtures;
  return (
    <section data-layer="2-action" className="space-y-3">
      <div>
        <div className="text-base font-semibold">
          <Mono>{f.queue.length}</Mono> customers need you today.
        </div>
        <div className="text-sm text-muted-foreground">
          GoCSM tried what it could — these need a human.
        </div>
      </div>

      <Queue>
        {f.queue.map((s) => (
          <SignalCard
            key={s.id}
            band={s.band}
            account={s.account}
            mrr={s.mrr}
            story={s.story}
            conf={s.conf}
            confDetail={s.confDetail}
            saveWindow={
              s.saveWindow ? <SaveWindow>{s.saveWindow}</SaveWindow> : null
            }
            provenance={
              <ProvenanceExpander
                label="See the data behind this"
                summary={null}
              >
                <ul className="text-xs space-y-1">
                  {s.factors.map((fac, i) => (
                    <li key={i}>
                      <span className="text-muted-foreground">[{fac.pillar}]</span>{" "}
                      {fac.text}
                    </li>
                  ))}
                </ul>
              </ProvenanceExpander>
            }
            onSeePlaybook={() => {
              /* placeholder */
            }}
            action={
              <ActionButton variant="primary" size="md">
                {s.action.label}
              </ActionButton>
            }
          />
        ))}
      </Queue>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {f.vitals.map((v) => (
          <div key={v.label} className="border border-border rounded p-2">
            <div className="text-xs text-muted-foreground">{v.label}</div>
            <div className="text-lg font-semibold">
              <Mono>{v.value}</Mono>
            </div>
            <div className="text-xs text-muted-foreground">
              {v.delta ? `${v.delta.value} · ` : ""}
              {v.context}
            </div>
          </div>
        ))}
      </div>


      {mode === "team" && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
            Problem cohorts
          </div>
          <ul className="space-y-1 text-sm">
            {f.problemCohorts.map((c) => (
              <li key={c.id} className="flex justify-between border border-border rounded p-2">
                <span>{c.label} ({c.count})</span>
                <span className="text-muted-foreground">{c.assignee} · {c.note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function Layer3Evidence({ mode }: { mode: BriefingMode }) {
  const e = briefingFixtures.evidence;
  return (
    <section data-layer="3-evidence" className="space-y-3 border border-border rounded-md p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        Layer 3 — Evidence (mode: {mode})
      </div>
      <div className="text-sm">
        Agency score: <span className="font-mono">{e.score}</span> · band {e.band}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {e.distribution.map((b) => (
          <div key={b.band} className="border border-border rounded p-2 text-sm">
            <div className="text-xs text-muted-foreground">{b.band}</div>
            <div className="font-mono">{b.count}</div>
            <div className="text-xs text-muted-foreground">{b.pct}%</div>
          </div>
        ))}
      </div>
      <div className="text-xs text-muted-foreground">
        Trend (60d, {e.trend.length} points): {e.trend[0].score} → {e.trend[e.trend.length - 1].score}
      </div>
      <div className="text-xs text-muted-foreground">
        Pillar weights — PAS {e.pillarWeights.pas} · Revenue {e.pillarWeights.revenue} · Login{" "}
        {e.pillarWeights.login} · Feedback {e.pillarWeights.feedback}
      </div>
      <ul className="text-xs list-disc pl-4">
        {e.factors.map((f, i) => (
          <li key={i}>{f.text}</li>
        ))}
      </ul>
    </section>
  );
}

export default function BriefingPage() {
  const [mode, setMode] = useState<BriefingMode>("solo");
  const queueRef = useRef<HTMLDivElement | null>(null);
  const scrollToQueue = () =>
    queueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  return (
    <div className="relative space-y-6">
      <div className="fixed bottom-3 right-3 z-50 flex gap-1 bg-background border border-border rounded p-1 text-xs">
        <button
          onClick={() => setMode("solo")}
          className={`px-2 py-1 rounded ${mode === "solo" ? "bg-muted font-semibold" : ""}`}
        >
          solo
        </button>
        <button
          onClick={() => setMode("team")}
          className={`px-2 py-1 rounded ${mode === "team" ? "bg-muted font-semibold" : ""}`}
        >
          team
        </button>
      </div>
      <Layer1Verdict mode={mode} onWaitingClick={scrollToQueue} />
      <div ref={queueRef}>
        <Layer2Action mode={mode} />
      </div>
      <Layer3Evidence mode={mode} />
    </div>
  );
}

