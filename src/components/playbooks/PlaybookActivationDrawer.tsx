// Shared Playbook activation drawer — opens from:
//   • Today (queue rows + cohort cards) pre-scoped to those accounts
//   • Accounts page (multi-select → Apply a Playbook) pre-scoped to selection
//   • Playbook detail page (its own use)
//
// Composes DS PlaybookActivation + ActionReceipt + a light playbook picker.
// All sends are reversible (5s grace) and show blastRadius.

import { useMemo, useState } from "react";
import {
  Badge,
  Button,
  Card,
  Icon,
  Mono,
  PlaybookActivation,
  ActionReceipt,
  ConfTag,
} from "@/gocsm-ds";
import {
  playbooks,
  matchesToday,
  type Playbook,
  type PlaybookState,
} from "@/fixtures/playbooks";
import type { Account } from "@/fixtures";

export type DrawerScope =
  | { kind: "playbook"; playbookId: string }
  | { kind: "accounts"; accountIds: string[]; suggested?: string };

interface Props {
  open: boolean;
  scope: DrawerScope | null;
  accounts: Account[]; // available pool to resolve ids
  onClose: () => void;
}

const BLAST =
  "Nothing is sent to the account's own clients. Drafts to the customer always need your OK first.";

export function PlaybookActivationDrawer({ open, scope, accounts, onClose }: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [state, setState] = useState<PlaybookState>("off");
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<{ state: "pending" | "sent" | "stopped"; ranOn: number } | null>(null);
  const [ranCount, setRanCount] = useState(0);

  // Resolve the effective playbook
  const playbookId = useMemo(() => {
    if (!scope) return "";
    if (scope.kind === "playbook") return scope.playbookId;
    if (selectedId) return selectedId;
    return scope.suggested ?? "";
  }, [scope, selectedId]);

  const playbook = useMemo(
    () => playbooks.find((p) => p.id === playbookId),
    [playbookId],
  );

  // Resolve targeted accounts
  const targets = useMemo<Account[]>(() => {
    if (!scope) return [];
    if (scope.kind === "accounts") {
      const set = new Set(scope.accountIds);
      return accounts.filter((a) => set.has(a.identity.id));
    }
    return playbook ? matchesToday(playbook) : [];
  }, [scope, accounts, playbook]);

  // Suggested plays for an account-scoped open: rank by match overlap
  const suggestions = useMemo(() => {
    if (!scope || scope.kind !== "accounts") return [];
    const ids = new Set(scope.accountIds);
    return playbooks
      .map((p) => ({
        p,
        overlap: matchesToday(p).filter((a) => ids.has(a.identity.id)).length,
      }))
      .sort((a, b) => b.overlap - a.overlap);
  }, [scope]);

  if (!open || !scope) return null;

  const reset = () => {
    setSelectedId("");
    setState("off");
    setBusy(false);
    setReceipt(null);
    setRanCount(0);
  };
  const close = () => {
    reset();
    onClose();
  };

  const runOnce = () => {
    if (!playbook || targets.length === 0) return;
    setBusy(true);
    setReceipt({ state: "pending", ranOn: targets.length });
    window.setTimeout(() => {
      setReceipt((r) => (r ? { ...r, state: "sent" } : r));
      setRanCount(targets.length);
      setState("ranonce");
      setBusy(false);
    }, 800);
  };
  const goAutopilot = () => setState("on");
  const turnOff = () => {
    setState("off");
    setReceipt(null);
    setRanCount(0);
  };
  const undo = () => setReceipt((r) => (r ? { ...r, state: "stopped" } : r));

  return (
    <div
      role="dialog"
      aria-modal
      onClick={close}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(8, 14, 28, 0.55)",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "flex-end",
        zIndex: 50,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(600px, 100%)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          overflowY: "auto",
          padding: "var(--s-5)",
          color: "var(--text)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-4)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            Activate a Playbook · scoped to{" "}
            <Mono>{targets.length}</Mono> account{targets.length === 1 ? "" : "s"}
          </span>
          <Button variant="ghost" size="sm" onClick={close}>
            Close <Icon name="x" />
          </Button>
        </div>

        {/* Picker when account-scoped */}
        {scope.kind === "accounts" && !playbook ? (
          <Card padded>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}>
              <div>
                <h3 style={{ font: "var(--t-h3)", margin: 0 }}>Pick a play</h3>
                <p
                  style={{
                    font: "var(--t-meta)",
                    color: "var(--text-3, var(--text))",
                    margin: "var(--s-1) 0 0",
                  }}
                >
                  Sorted by how many of your selected accounts already match.
                </p>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column" }}>
                {suggestions.map(({ p, overlap }) => (
                  <li
                    key={p.id}
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--s-2)",
                      padding: "var(--s-2) 0",
                      borderTop: "1px solid var(--border)",
                      cursor: "pointer",
                    }}
                  >
                    <Icon name={p.icon} />
                    <span style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                      <span style={{ font: "var(--t-body)" }}>{p.title}</span>
                      <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
                        {p.subtitle}
                      </span>
                    </span>
                    <Badge variant={overlap ? "blue" : "neutral"} dot={false}>
                      <Mono>{overlap}</Mono> match
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ) : null}

        {/* Activation card */}
        {playbook ? (
          <>
            <PlaybookActivation
              icon={playbook.icon}
              title={playbook.title}
              situation={playbook.problem}
              state={state === "paused" ? "off" : (state as "off" | "ranonce" | "on")}
              proof={{ matchCount: targets.length }}
              ranCount={ranCount}
              busy={busy}
              onRunOnce={runOnce}
              onAutopilot={goAutopilot}
              onTurnOff={turnOff}
              onPreview={() => undefined}
              onClose={close}
            />
            {scope.kind === "accounts" ? (
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="ghost" size="sm" onClick={() => setSelectedId("")}>
                  Pick a different play
                </Button>
              </div>
            ) : null}
          </>
        ) : null}

        {receipt ? (
          <ActionReceipt
            state={receipt.state}
            title={`${playbook?.title ?? "Playbook"} — running on ${receipt.ranOn} account${receipt.ranOn === 1 ? "" : "s"}`}
            scope="All actions toggled on for this play will run per matching account."
            blastRadius={BLAST}
            graceSeconds={5}
            reportBack="We'll report back with what changed within 24h."
            onUndo={undo}
          />
        ) : null}

        <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)" }}>
          <ConfTag basis="fact" />
          <span style={{ font: "var(--t-meta)", color: "var(--text-3, var(--text))" }}>
            Scope is a live snapshot. Reversible during a 5-second grace window.
          </span>
        </div>
      </div>
    </div>
  );
}
