import * as React from "react";
import { PlaybookState } from "./PlaybookCard";

export interface PlaybookAction {
  icon?: string;
  title?: React.ReactNode;
  desc?: React.ReactNode;
  on?: boolean;
  /** Client-facing / higher-risk → shows "Needs your OK"; otherwise "Automatic". */
  supervised?: boolean;
  onToggle?: (on: boolean) => void;
  onEdit?: () => void;
}
export interface PlaybookProof {
  matchCount?: number;
  drafts?: { channel?: React.ReactNode; icon?: string; preview?: React.ReactNode }[];
}
export interface PlaybookWatch {
  /** Plain sentence: what it watches for. */
  summary?: React.ReactNode;
  /** e.g. "Checks nightly". */
  cadence?: React.ReactNode;
  /** Quiet "how it runs" line (GoCSM's call, not the owner's). */
  via?: React.ReactNode;
}
export interface PlaybookDetailProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  state?: PlaybookState;
  /** Suppress the duplicate identity header (icon/state/title/subtitle) when the
   *  page already shows it as a hero; renders only the anatomy below. */
  hideIdentity?: boolean;
  problem?: React.ReactNode;
  does?: React.ReactNode;
  outcome?: React.ReactNode;
  watch?: PlaybookWatch;
  actions?: PlaybookAction[];
  proof?: PlaybookProof;
  /** The "How it works" section renders only when this real video node is supplied. */
  video?: React.ReactNode;
  /** @deprecated No-op — a label alone no longer renders a placeholder video bar. Pass `video` instead. */
  videoLabel?: React.ReactNode;
  limits?: (string | { name?: React.ReactNode })[];
  onRun?: () => void;
  onPreview?: () => void;
  primaryLabel?: React.ReactNode;
}
export function PlaybookDetail(props: PlaybookDetailProps): JSX.Element;
