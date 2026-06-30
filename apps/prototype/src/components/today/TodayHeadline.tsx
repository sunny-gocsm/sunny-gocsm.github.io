import { useEffect, useMemo, useState } from "react";
import { Verdict } from "@gocsm/design-system";
import { composeHeadline, type OrientationData } from "@/fixtures/orientation";

// Layer 0 — the AI Orientation Headline. One tight, plain-English paragraph: what we know
// about your book + the problems that matter, dollar-led.
//
// ARCHITECTURE (see fixtures/orientation.ts): the numbers are computed deterministically and
// passed in; this component only triggers the PHRASING and renders it. In production the
// phrasing is an async LLM call that receives the OrientationData and writes the sentence;
// here we simulate that latency so the async contract is visible — tiles + queue render
// immediately while the headline streams in behind a skeleton. If phrasing is slow or fails,
// we fall back to composeHeadline()'s deterministic text, so the page never looks broken.

const GEN_MS = 450; // simulated phrasing latency — shows the skeleton, then streams the line in.

function SkeletonLines() {
  return (
    <div className="today-headline-sk" aria-hidden>
      <span className="skeleton" style={{ height: 14, width: "92%" }} />
      <span className="skeleton" style={{ height: 14, width: "98%" }} />
      <span className="skeleton" style={{ height: 14, width: "54%" }} />
    </div>
  );
}

export default function TodayHeadline({ data }: { data: OrientationData }) {
  const headline = useMemo(() => composeHeadline(data), [data]);
  const [ready, setReady] = useState(false);

  // Re-run the (simulated) phrasing whenever the underlying summary changes (e.g. phase toggle).
  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), GEN_MS);
    return () => clearTimeout(t);
  }, [data]);

  return (
    <Verdict
      className="today-headline"
      tone={ready ? headline.tone : "watch"}
      attribution="GoCSM AI"
      stamp={
        ready ? (
          <span className="today-ai-note">Figures are exact · wording is AI-generated</span>
        ) : null
      }
    >
      {ready ? headline.text : <SkeletonLines />}
    </Verdict>
  );
}
