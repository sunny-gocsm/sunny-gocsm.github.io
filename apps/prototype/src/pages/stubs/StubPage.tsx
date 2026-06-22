interface StubPageProps {
  title: string;
}

export default function StubPage({ title }: StubPageProps) {
  return (
    <main
      style={{
        padding: "var(--s-8) var(--s-6)",
        maxWidth: 960,
        margin: "0 auto",
        color: "var(--text)",
      }}
    >
      <h1 style={{ font: "var(--t-h2)", margin: 0 }}>{title}</h1>
      <p
        style={{
          font: "var(--t-body)",
          color: "var(--text-3, var(--text-2, var(--text)))",
          marginTop: "var(--s-3)",
        }}
      >
        Coming next.
      </p>
    </main>
  );
}
