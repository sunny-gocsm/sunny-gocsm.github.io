import { Link } from "react-router-dom";
import { BriefingHeader, DigestTristat, LiveStatus, Icon } from "@/gocsm-ds";
import { header, digest } from "./briefing.fixtures";

function greetingFor(name: string) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${part}, ${name}.`;
}

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

export default function Briefing() {
  return (
    <div className="flex flex-col gap-8">
      <VerdictLayer />
    </div>
  );
}
