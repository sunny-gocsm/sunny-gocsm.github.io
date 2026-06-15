import React from "react";

/** AppShell — the operator-shell layout: a fixed Rail beside a scrolling main column topped by the
 *  brand stripe. Pass the sidebar via `rail` (e.g., <Rail groups={...} active="my-queue" />) and the
 *  page body as children (e.g., <MyQueue />). Layout only — no business logic. */
export function AppShell({ rail, children, ...rest }) {
  return (
    <div className="app-shell" {...rest}>
      {rail}
      <div className="main">
        <div className="topbar" />
        {children}
      </div>
    </div>
  );
}
