import * as React from "react";

/** GoCSM Tabs — page tab row / Hub lens switcher. */
export interface TabItem { id: string; label: string; }
export interface TabsProps {
  /** Tabs as strings (id = label) or {id,label} objects. */
  tabs: Array<string | TabItem>;
  /** id of the active tab. */
  active: string;
  /** Called with the next tab id. */
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs(props: TabsProps): JSX.Element;
