import React from "react";
import { Icon } from "../util/Icon.jsx";
/**
 * StageTile — a distribution tile that passes the Sara test: the big mono number never
 * stands alone; it carries a plain-words definition and one line of guidance.
 * band: thriving | healthy | watch | atrisk | neutral. Use `empty` for a 0.
 */
export function StageTile({ band = "neutral", n, name, def, guide, guideIcon = "arrow-right", empty = false, ...rest }) {
  const cls = ["stage-tile", band, empty && "empty"].filter(Boolean).join(" ");
  return (
    <div className={cls} {...rest}>
      <div className="num">{n}</div>
      <div className="name">{name}</div>
      {def ? <div className="def">{def}</div> : null}
      {guide ? (
        <div className="guide">
          <Icon name={guideIcon} />
          {guide}
        </div>
      ) : null}
    </div>
  );
}
