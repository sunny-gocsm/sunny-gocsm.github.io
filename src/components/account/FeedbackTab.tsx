import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Card, MetricCard, Mono, ConfTag, Icon } from "@/gocsm-ds";
import type { Account, FeedbackResponse } from "@/fixtures";
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined,{month:"short",day:"numeric"});

const SENTIMENT_VARIANT: Record<"positive" | "neutral" | "negative", "pos" | "blue" | "danger"> = {
  positive: "pos",
  neutral: "blue",
  negative: "danger",
};

const scoreBucket = (n: number): "Promoter" | "Passive" | "Detractor" =>
  n >= 9 ? "Promoter" : n >= 7 ? "Passive" : "Detractor";

const bucketVariant: Record<"Promoter" | "Passive" | "Detractor", "pos" | "blue" | "danger"> = {
  Promoter: "pos",
  Passive: "blue",
  Detractor: "danger",
};

export function FeedbackTab({ account }: { account: Account }) {
  const { feedback } = account;

  const total = feedback.promoters + feedback.passives + feedback.detractors;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const hasResponses = feedback.responses.length > 0;
  const lowData = total < 5;

  const trend = useMemo(() => {
    if (!hasResponses) return [];
    return [...feedback.responses]
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
      .map((r) => ({ date: fmtDate(r.date), score: r.score }));
  }, [feedback.responses, hasResponses]);

  if (!feedback.widgetEnabled && !hasResponses) {
    return (
      <Card padded>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
            <h4 style={{ font: "var(--t-h4)", margin: 0 }}>No feedback yet</h4>
            <ConfTag basis="guess" detail="widget off" />
          </div>
          <p style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))", margin: 0 }}>
            The NPS widget is off for this account. Turn it on to start collecting sentiment.
          </p>
        </div>
      </Card>
    );
  }

  // Single worst metric per tab (R8).
  type WorstKey = "nps" | "sentiment" | "responses" | "last" | null;
  const worst: WorstKey =
    feedback.sentiment === "negative"
      ? "sentiment"
      : feedback.npsScore < 7
      ? "nps"
      : total === 0
      ? "responses"
      : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}>
      {/* Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--s-3)",
        }}
      >
        <MetricCard
          label="NPS score"
          value={<Mono>{feedback.npsScore}</Mono>}
          icon={<Icon name="smile" />}
          iconTone={feedback.npsScore >= 9 ? "pos" : feedback.npsScore >= 7 ? "info" : "neg"}
          accent={worst === "nps" ? "neg" : null}
        />
        <MetricCard
          label="Sentiment"
          value={
            <Badge variant={SENTIMENT_VARIANT[feedback.sentiment]} dot>
              {feedback.sentiment}
            </Badge>
          }
          icon={<Icon name="message-circle" />}
          iconTone={feedback.sentiment === "positive" ? "pos" : feedback.sentiment === "neutral" ? "info" : "neg"}
          accent={worst === "sentiment" ? "neg" : null}
        />
        <MetricCard
          label="Responses"
          value={<Mono>{total}</Mono>}
          icon={<Icon name="inbox" />}
          iconTone={total === 0 ? "warn" : "info"}
          accent={worst === "responses" ? "neg" : null}
        />
        <MetricCard
          label="Last feedback"
          value={
            feedback.lastFeedbackDate ? (
              <span>{fmtDate(feedback.lastFeedbackDate)}</span>
            ) : (
              <span style={{ color: "var(--text-3, var(--text))" }}>—</span>
            )
          }
          icon={<Icon name="calendar" />}
          iconTone="info"
        />
      </div>

      {/* Widget state */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", flexWrap: "wrap" }}>
        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          NPS widget
        </span>
        <Badge variant={feedback.widgetEnabled ? "pos" : "neutral"} dot>
          {feedback.widgetEnabled ? "Enabled" : "Disabled"}
        </Badge>
        {lowData ? <ConfTag basis="guess" detail={`${total} response(s)`} /> : null}
      </div>

      {/* Breakdown */}
      <Card padded>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
          <h4 style={{ font: "var(--t-h4)", margin: 0 }}>Promoters · Passives · Detractors</h4>
          {total ? (
            <>
              <div
                style={{
                  display: "flex",
                  height: 12,
                  borderRadius: 6,
                  overflow: "hidden",
                  background: "var(--surface-2)",
                }}
                role="img"
                aria-label="Response breakdown"
              >
                {feedback.promoters ? (
                  <span style={{ width: `${pct(feedback.promoters)}%`, background: "var(--viz-2)" }} />
                ) : null}
                {feedback.passives ? (
                  <span style={{ width: `${pct(feedback.passives)}%`, background: "var(--viz-5)" }} />
                ) : null}
                {feedback.detractors ? (
                  <span style={{ width: `${pct(feedback.detractors)}%`, background: "var(--viz-3)" }} />
                ) : null}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "var(--s-3)",
                }}
              >
                <Stat label="Promoters" count={feedback.promoters} pct={pct(feedback.promoters)} color="var(--viz-2)" />
                <Stat label="Passives" count={feedback.passives} pct={pct(feedback.passives)} color="var(--viz-5)" />
                <Stat label="Detractors" count={feedback.detractors} pct={pct(feedback.detractors)} color="var(--viz-3)" />
              </div>
            </>
          ) : (
            <span style={{ font: "var(--t-body)", color: "var(--text-2, var(--text))" }}>
              No responses yet — the widget is live and listening.
            </span>
          )}
        </div>
      </Card>

      {/* Trend chart */}
      {trend.length > 1 ? (
        <Card padded>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <h4 style={{ font: "var(--t-h4)", margin: 0 }}>NPS trend</h4>
            <div style={{ width: "100%", height: 180 }}>
              <ResponsiveContainer>
                <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--viz-grid)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--viz-axis)" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="var(--viz-axis)" fontSize={11} width={28} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      font: "var(--t-meta)",
                    }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--viz-seq-5)" strokeWidth={2} dot={{ r: 3, fill: "var(--viz-seq-5)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      ) : null}

      {/* Recent responses */}
      <section style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
        <h4 style={{ font: "var(--t-h4)", margin: 0 }}>Recent responses</h4>
        {feedback.responses.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            {[...feedback.responses]
              .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
              .map((r: FeedbackResponse, i: number) => {
                const bucket = scoreBucket(r.score);
                return (
                  <Card key={i} padded>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-3)" }}>
                      <div style={{ minWidth: 56, textAlign: "center" }}>
                        <div style={{ font: "var(--t-h3)", margin: 0 }}>
                          <Mono>{r.score}</Mono>
                        </div>
                        <Badge variant={bucketVariant[bucket]} dot>
                          {bucket}
                        </Badge>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--s-1)" }}>
                        <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                          {fmtDate(r.date)}
                        </span>
                        <p style={{ font: "var(--t-body)", margin: 0 }}>
                          {r.comment ?? <span style={{ color: "var(--text-3, var(--text))" }}>No comment.</span>}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        ) : (
          <Card padded>
            <span style={{ font: "var(--t-body)", color: "var(--text-3, var(--text))" }}>
              No responses captured yet.
            </span>
          </Card>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  count,
  pct,
  color,
}: {
  label: string;
  count: number;
  pct: number;
  color: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
        <span style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
        {label}
      </span>
      <span style={{ font: "var(--t-h4)" }}>
        <Mono>{count}</Mono> <span style={{ color: "var(--text-3, var(--text))", font: "var(--t-meta)" }}>· <Mono>{pct}%</Mono></span>
      </span>
    </div>
  );
}
