import { useState } from "react";
import { briefingFixtures, type BriefingMode } from "./briefing.fixtures";

function Layer1Verdict({ mode }: { mode: BriefingMode }) {
  const f = briefingFixtures;
  return (
    <section data-layer="1-verdict" className="space-y-2 border border-border rounded-md p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Layer 1 — Verdict</div>
      <div className="text-lg font-semibold">Good morning, {f.header.ownerName}.</div>
      <div className="text-sm text-muted-foreground">Last sync: {f.header.lastSync}</div>
      <div className="text-sm">{f.digest.line}</div>
      <div className="text-sm">
        Sent {f.digest.sent} · Alerted {f.digest.alerted} · Waiting {f.digest.waiting}
      </div>
      {f.isNewAgency && (
        <div className="mt-2 p-2 border border-dashed border-border rounded text-sm">
          {f.coldStart.banner} <button className="underline">{f.coldStart.cta}</button>
        </div>
      )}
      <div className="text-xs text-muted-foreground">mode: {mode}</div>
    </section>
  );
}

function Layer2Action({ mode }: { mode: BriefingMode }) {
  const f = briefingFixtures;
  return (
    <section data-layer="2-action" className="space-y-3 border border-border rounded-md p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">Layer 2 — Action</div>
      <div className="font-semibold">{f.queue.length} customers need you today</div>
      <ol className="space-y-2">
        {f.queue.map((s) => (
          <li key={s.id} className="text-sm border border-border rounded p-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase px-1 border rounded">{s.band}</span>
              {mode === "team" && s.assignee && (
                <span className="text-[10px] px-1 border rounded">{s.assignee}</span>
              )}
              <span className="font-medium">{s.account}</span>
              <span className="text-muted-foreground">· ${s.mrr.toLocaleString()}</span>
            </div>
            <div className="mt-1">{s.story}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              conf: {s.conf}{s.confDetail ? ` (${s.confDetail})` : ""}
              {s.saveWindow ? ` · ${s.saveWindow}` : ""}
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                factors: {s.factors.map((x) => x.text).join(" · ")}
              </span>
              <button className="text-xs underline">{s.action.label}</button>
            </div>
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {f.vitals.map((v) => (
          <div key={v.label} className="border border-border rounded p-2">
            <div className="text-xs text-muted-foreground">{v.label}</div>
            <div className="text-lg font-semibold">{v.value}</div>
            <div className="text-xs text-muted-foreground">
              {v.delta ? `${v.delta.value} · ` : ""}{v.context}
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
  return (
    <div className="relative space-y-4">
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
      <Layer1Verdict mode={mode} />
      <Layer2Action mode={mode} />
      <Layer3Evidence mode={mode} />
    </div>
  );
}
