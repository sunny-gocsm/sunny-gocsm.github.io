type Tab = { id: string; label: string; active?: boolean; onClick?: () => void };

export function PageHeader({ title, tabs }: { title: string; tabs?: Tab[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h1
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 26,
          fontWeight: 600,
          color: "var(--text)",
          margin: 0,
          lineHeight: 1.2,
        }}
      >
        {title}
      </h1>
      {tabs && tabs.length > 0 && (
        <div className="tabs">
          {tabs.map((t) => (
            <div
              key={t.id}
              className={`tab${t.active ? " active" : ""}`}
              onClick={t.onClick}
            >
              {t.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
