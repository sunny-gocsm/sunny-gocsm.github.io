import * as React from "react";
import { PlaybookProof } from "./PlaybookDetail";

export interface PlaybookActivationProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: string;
  title?: React.ReactNode;
  situation?: React.ReactNode;
  /** The rung of the ladder. @default "off" */
  state?: "off" | "ranonce" | "on";
  proof?: PlaybookProof;
  /** After a run: how many accounts it ran on. */
  ranCount?: number;
  onRunOnce?: () => void;
  onAutopilot?: () => void;
  onTurnOff?: () => void;
  onPreview?: () => void;
  onClose?: () => void;
  busy?: boolean;
}
export function PlaybookActivation(props: PlaybookActivationProps): JSX.Element;
