import React from "react";
import { Icon } from "../util/Icon.jsx";

/**
 * GoCSM PromptArea — the multi-line natural-language HERO input (sibling to the
 * single-line PromptField). The most actionable thing on its surface: a soft-blue
 * "AI" surface, an auto-growing textarea (min ~3 → max ~6 rows, then internal
 * scroll), a state-aware primary submit, a persistent honest helper line, and
 * tappable example chips below. Keyboard model: ⌘/Ctrl+Enter submits, plain Enter
 * is a newline (it's a composition box). Maps to .prompt-area.
 *
 * Controlled: pass `value` + `onValueChange(text)`; `onSubmit(text)` fires on the
 * button and on ⌘/Ctrl+Enter. `examples` are { label, fill? } — tapping one fills
 * the box (fill ?? label).
 */
export function PromptArea({
  value = "",
  onValueChange,
  onSubmit,
  placeholder = "Describe who this should run on…",
  submitLabel = "Build rules",
  busyLabel = "Compiling…",
  hint,
  examples = [],
  busy = false,
  minRows = 3,
  maxRows = 6,
  icon = "sparkles",
  className = "",
  ...rest
}) {
  const ref = React.useRef(null);

  // Auto-grow: reset height, then grow to scrollHeight capped at maxRows.
  const resize = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const cs = window.getComputedStyle(el);
    const line = parseFloat(cs.lineHeight) || 20;
    const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const max = line * maxRows + padV;
    const next = Math.min(el.scrollHeight, max);
    el.style.height = next + "px";
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [maxRows]);

  React.useEffect(() => {
    resize();
  }, [value, resize]);

  const submit = () => {
    if (busy) return;
    if (!String(value).trim()) return;
    onSubmit && onSubmit(value);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submit();
    }
  };

  const fillExample = (ex) => {
    const text = ex.fill != null ? ex.fill : ex.label;
    onValueChange && onValueChange(text);
    requestAnimationFrame(() => {
      resize();
      ref.current && ref.current.focus();
    });
  };

  const disabled = busy || !String(value).trim();

  return (
    <div className={["prompt-area", busy ? "is-busy" : "", className].filter(Boolean).join(" ")} {...rest}>
      <div className="pa-field">
        <span className="pa-ico" aria-hidden><Icon name={icon} /></span>
        <textarea
          ref={ref}
          className="pa-input"
          rows={minRows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onValueChange && onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label={placeholder}
        />
      </div>

      <div className="pa-actions">
        {hint ? <span className="pa-hint">{hint}</span> : <span />}
        <div className="pa-submit-wrap">
          <span className="pa-kbd" aria-hidden>⌘↵</span>
          <button
            type="button"
            className="pa-submit"
            onClick={submit}
            disabled={disabled}
            aria-busy={busy || undefined}
          >
            {busy ? (
              <>
                <Icon name="loader-circle" className="pa-spin" />
                <span>{busyLabel}</span>
              </>
            ) : (
              <>
                <span>{submitLabel}</span>
                <Icon name="arrow-right" />
              </>
            )}
          </button>
        </div>
      </div>

      {examples && examples.length > 0 ? (
        <div className="pa-examples">
          <span className="pa-try">Try</span>
          {examples.map((ex, i) => (
            <button key={i} type="button" className="pa-example" onClick={() => fillExample(ex)}>
              {ex.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
