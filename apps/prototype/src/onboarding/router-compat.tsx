// Router compatibility shim — translates the TanStack Router navigation API
// (the shape the imported Lovable onboarding feature was written against) onto
// react-router-dom, which the host prototype uses. This is pure plumbing: it
// lets the onboarding feature components stay byte-for-byte identical except for
// their import source. No product behaviour changes.
//
// Supported surface (exactly what the feature uses):
//   useNavigate()  -> navigate({ to, params?, search?, replace? })
//   <Link to params? search? .../>
//   useRouterState({ select: s => s.location.pathname })

import {
  Link as RRLink,
  useNavigate as useRRNavigate,
  useLocation,
  type LinkProps as RRLinkProps,
} from "react-router-dom";
import { forwardRef, type ReactNode } from "react";

type NavParams = Record<string, string | number>;
type NavSearch = Record<string, unknown>;

export interface NavigateOptions {
  to: string;
  params?: NavParams;
  search?: NavSearch;
  replace?: boolean;
}

/** Interpolate `$param` segments and serialise a search object into a path. */
function buildPath(to: string, params?: NavParams, search?: NavSearch): string {
  let path = to;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      path = path.replace(`$${k}`, encodeURIComponent(String(v)));
    }
  }
  if (search) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(search)) {
      if (v === undefined || v === null) continue;
      qs.set(k, String(v));
    }
    const s = qs.toString();
    if (s) path += `?${s}`;
  }
  return path;
}

export function useNavigate() {
  const navigate = useRRNavigate();
  return (opts: NavigateOptions | string) => {
    if (typeof opts === "string") {
      navigate(opts);
      return;
    }
    navigate(buildPath(opts.to, opts.params, opts.search), { replace: opts.replace });
  };
}

export interface LinkProps extends Omit<RRLinkProps, "to"> {
  to: string;
  params?: NavParams;
  search?: NavSearch;
  children?: ReactNode;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, params, search, children, ...rest },
  ref,
) {
  return (
    <RRLink ref={ref} to={buildPath(to, params, search)} {...rest}>
      {children}
    </RRLink>
  );
});

/** Minimal useRouterState — only the `location.pathname` selector is used. */
export function useRouterState<T = string>(opts?: {
  select?: (s: { location: { pathname: string } }) => T;
}): T {
  const location = useLocation();
  const state = { location: { pathname: location.pathname } };
  return opts?.select ? opts.select(state) : (state as unknown as T);
}
