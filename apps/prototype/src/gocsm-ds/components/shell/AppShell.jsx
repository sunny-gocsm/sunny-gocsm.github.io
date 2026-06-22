import React from "react";
import { Icon } from "../util/Icon.jsx";

/** AppShell — the operator-shell layout: a Rail beside a scrolling main column.
 *  On desktop the Rail sits beside the content. On mobile (≤768px) it collapses
 *  into an off-canvas drawer behind a top bar with a menu button; tapping a nav item
 *  or the backdrop closes it. Pass the sidebar via `rail`, an optional `logo` for the
 *  mobile bar, and the page body as children. Layout only — no business logic. */
export function AppShell({ rail, logo = null, children, ...rest }) {
  const [navOpen, setNavOpen] = React.useState(false);
  return (
    <div
      className="app-shell"
      data-nav-open={navOpen ? "true" : "false"}
      onClick={(e) => {
        if (navOpen && e.target.closest && e.target.closest(".rail-item")) setNavOpen(false);
      }}
      {...rest}
    >
      <div className="app-mobilebar">
        <button
          type="button"
          className="app-menu-btn"
          aria-label="Menu"
          aria-expanded={navOpen}
          onClick={() => setNavOpen((v) => !v)}
        >
          <Icon name={navOpen ? "x" : "menu"} />
        </button>
        <span className="app-mobilebar-logo">{logo}</span>
      </div>
      <button
        type="button"
        className="app-backdrop"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={() => setNavOpen(false)}
      />
      {rail}
      <div className="main">
        <div className="topbar" />
        {children}
      </div>
    </div>
  );
}
