import React from "react";
import { Icon } from "../util/Icon.jsx";
import { Button } from "../core/Button.jsx";
import { HealthBadge } from "../health/HealthBadge.jsx";

/** DraftReviewSheet — the Approve surface: a floating sheet where a customer-facing draft waits for a
 *  human. Context (account/$MRR/play + why-band) → editable draft → Approve fires an ActionReceipt. */
export function DraftReviewSheet({
  account, mrr, play, band = "watch", why, voice = "your", channel = "Email",
  subject, draft, onApprove, onEdit, onSkip, dimmed = true, ...rest
}) {
  const initial = (account || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const hasMrr = mrr === 0 || Boolean(mrr);
  return (
    <div className={["draft-stage", !dimmed && "tight"].filter(Boolean).join(" ")} {...rest}>
      <div className="draft-sheet">
        <div className="sh-context">
          <div className="ctx-top">
            <span className="ctx-ava">{initial}</span>
            <span><span className="ctx-name">{account}</span>{hasMrr ? <span className="ctx-mrr">· ${Number(mrr).toLocaleString()}</span> : null}</span>
            {play ? <span className="ctx-play"><Icon name="book-open" />{play}</span> : null}
          </div>
          {why ? <div className="why-band"><HealthBadge band={band} /><span className="why-text">{why}</span></div> : null}
        </div>
        <div className="sh-draft">
          <div className="draft-h">
            <span className="voice-tag"><Icon name="sparkles" />Drafted in {voice} voice</span>
            <span className="channel">{channel}</span>
          </div>
          {subject ? <div className="subject-line"><span className="sl">Subject</span><span className="sv">{subject}</span></div> : null}
          <textarea className="draft-field" defaultValue={draft} />
          <div className="teach-note"><Icon name="graduation-cap" />Your edits teach GoCSM your voice.</div>
        </div>
        <div className="sh-actions">
          <Button variant="ai" icon={<Icon name="send" />} onClick={onApprove}>Approve &amp; send</Button>
          {onEdit ? <Button variant="secondary" size="sm" icon={<Icon name="pencil" />} onClick={onEdit}>Edit</Button> : null}
          {onSkip ? <Button variant="ghost" size="sm" onClick={onSkip}>Skip</Button> : null}
        </div>
      </div>
    </div>
  );
}

/** DraftBatch — the one-tap approve queue (Solo / Team). row.exec is a node (e.g., ExecChip). */
export function DraftBatch({ rows = [], waiting, onApproveAll, ...rest }) {
  return (
    <div className="draft-stage tight" {...rest}>
      <div className="batch">
        <div className="batch-head">
          <span className="bt">Drafts waiting</span>
          {waiting != null ? <span className="waiting"><Icon name="inbox" />Across the team · <span className="n">{waiting}</span></span> : null}
          {onApproveAll ? <span className="approve-all"><Button variant="ai" size="sm" icon={<Icon name="check-check" />} onClick={onApproveAll}>Approve all</Button></span> : null}
        </div>
        {rows.map((r, i) => {
          const initial = (r.account || "?").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
          const hasMrr = r.mrr === 0 || Boolean(r.mrr);
          return (
            <div key={i} className="batch-row">
              <span className="ava">{initial}</span>
              <div className="br-main">
                <div className="br-name">{r.account}{hasMrr ? <span className="mrr">· ${Number(r.mrr).toLocaleString()}</span> : null}</div>
                {r.preview ? <div className="br-preview">{r.preview}</div> : null}
              </div>
              {r.exec ? <div className="br-exec">{r.exec}</div> : null}
              <div className="br-actions">
                <button type="button" className="icon-btn" aria-label="Approve" onClick={r.onApprove}><Icon name="check" /></button>
                <button type="button" className="icon-btn" aria-label="More" onClick={r.onMore}><Icon name="more-horizontal" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
