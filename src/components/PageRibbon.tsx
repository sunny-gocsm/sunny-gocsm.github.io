import { ReactNode } from "react";

/**
 * PageRibbon — shared title block at the top of every primary page.
 *
 * Shape:
 *   [optional kicker / breadcrumb]
 *   <h1 .t-display-lg | .t-heading>  Title           [optional trailing slot]
 *   <p .t-body-sm>                   One-line "what this page is for"
 *   ───────────────────────────────────────────────
 *   [optional compact KPI / summary strip]
 *
 * Everything below the description is optional. Numbers inside `kpis` should
 * already be wrapped in <Mono>; the ribbon does not impose mono on them.
 */
export type PageRibbonKpi = {
  label: ReactNode;
  value: ReactNode;
};

export type PageRibbonProps = {
  title: ReactNode;
  description?: ReactNode;
  kpis?: PageRibbonKpi[];
  kicker?: ReactNode;
  trailing?: ReactNode;
  size?: "lg" | "md";
  /** Extra inline strip rendered between description and KPI strip. */
  children?: ReactNode;
};

export function PageRibbon({
  title,
  description,
  kpis,
  kicker,
  trailing,
  size = "lg",
  children,
}: PageRibbonProps) {
  const titleClass = size === "lg" ? "t-display-lg" : "t-heading";

  return (
    <header
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--s-2)",
      }}
    >
      {kicker ? (
        <div
          style={{
            font: "var(--t-meta)",
            color: "var(--text-3, var(--text))",
            display: "flex",
            alignItems: "center",
            gap: "var(--s-1)",
          }}
        >
          {kicker}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "var(--s-3)",
        }}
      >
        <h1
          className={titleClass}
          style={{ margin: 0, flex: 1, minWidth: 0 }}
        >
          {title}
        </h1>
        {trailing ? (
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            {trailing}
          </div>
        ) : null}
      </div>

      {description ? (
        <p
          className="t-body-sm"
          style={{ margin: 0, color: "var(--text-2, var(--text))" }}
        >
          {description}
        </p>
      ) : null}

      {children}

      {kpis && kpis.length ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--s-2) var(--s-5)",
            marginTop: "var(--s-2)",
            paddingTop: "var(--s-3)",
            borderTop: "1px solid var(--border)",
            alignItems: "baseline",
          }}
        >
          {kpis.map((k, i) => (
            <div
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "baseline",
                gap: "var(--s-1)",
              }}
            >
              <span
                style={{
                  font: "var(--t-meta)",
                  color: "var(--text-3, var(--text))",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {k.label}
              </span>
              <span style={{ font: "var(--t-body)", color: "var(--text)" }}>
                {k.value}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export default PageRibbon;
