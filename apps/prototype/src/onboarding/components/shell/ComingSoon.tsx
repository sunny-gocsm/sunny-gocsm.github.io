import { Link } from "@onb/router-compat";

export function ComingSoon() {
  return (
    <div className="card card-padded">
      <div className="empty">
        <div className="empty-art" />
        <div>This area isn't part of the onboarding prototype.</div>
        <div style={{ marginTop: "var(--s-4)" }}>
          <Link
            to="/onboarding"
            style={{ color: "var(--blue-7)", fontWeight: 500, textDecoration: "none" }}
          >
            Back to Onboarding
          </Link>
        </div>
      </div>
    </div>
  );
}
