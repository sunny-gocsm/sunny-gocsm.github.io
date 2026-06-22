import React from "react";
import { Icon } from "../util/Icon.jsx";

/** BriefingHeader — the daily Brief opening: greeting + promise + honest sync line.
 *  `sync` is a node (e.g., <LiveStatus state="recent" label="checked 6h ago" />). */
export function BriefingHeader({ name, greeting, promise, sync, ...rest }) {
  return (
    <div className="briefing-header" {...rest}>
      <div className="bh-main">
        <div className="greeting">{greeting || `Good morning, ${name || "there"}.`}</div>
        {promise ? <div className="promise">{promise}</div> : null}
        {sync ? <div className="sync">{sync}</div> : null}
      </div>
    </div>
  );
}

const TILE = {
  sent: { icon: "send", name: "Sent", desc: "emails & nudges sent overnight" },
  alerted: { icon: "bell", name: "Alerted you", desc: "accounts flagged for you" },
  waiting: { icon: "inbox", name: "Waiting on you", desc: "drafts waiting on your approval" },
};
function DigestTile({ kind, n, desc, onClick }) {
  const t = TILE[kind] || TILE.sent;
  return (
    <div className={["digest-tile", kind].join(" ")} onClick={onClick}>
      <div className="tl-top"><span className="tl-ico"><Icon name={t.icon} /></span><span className="tl-name">{t.name}</span></div>
      <div className="tl-num">{n}</div>
      <div className="tl-desc">{desc || t.desc}</div>
    </div>
  );
}
/** DigestTristat — the overnight digest: AI-presence line + Sent / Alerted / Waiting tiles.
 *  Reports completed work, so it carries LiveStatus, not a ConfTag. A 0 reads in words. */
export function DigestTristat({ sent, alerted, waiting, line, onWaiting, ...rest }) {
  return (
    <div className="digest" {...rest}>
      {line ? (
        <div className="dg-line">
          <span className="dg-glyph"><Icon name="sparkles" /></span>
          <span className="dg-text">{line}</span>
        </div>
      ) : null}
      <div className="digest-tristat">
        <DigestTile kind="sent" n={sent} />
        <DigestTile kind="alerted" n={alerted} />
        <DigestTile kind="waiting" n={waiting} onClick={onWaiting} />
      </div>
    </div>
  );
}
