import * as React from "react";

export interface RuleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  match?: "all" | "any";
  onMatchChange?: (match: "all" | "any") => void;
  children?: React.ReactNode;
  onAddCondition?: () => void;
  onAddGroup?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  label?: React.ReactNode;
  variant?: "group" | "bare";
  addConditionLabel?: string;
  addGroupLabel?: string;
  className?: string;
}

export declare function RuleGroup(props: RuleGroupProps): React.JSX.Element;
