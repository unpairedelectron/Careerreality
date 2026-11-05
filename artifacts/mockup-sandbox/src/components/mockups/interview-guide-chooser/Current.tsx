import "./_group.css";

const roles = [
  ["data-engineer", "Data Engineer"],
  ["data-scientist", "Data Scientist"],
  ["ai-ml-engineer", "AI/ML Engineer"],
  ["gen-ai-engineer", "Generative AI Engineer"],
  ["agentic-ai-engineer", "Agentic AI Engineer"],
] as const;

export function Current() {
  return (
    <div className="ig-extracted">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="font-display text-4xl">Choose an interview guide</h1>
        <p className="mt-3 text-muted-foreground">
          These draft guides are educational resources, not predictions about hiring outcomes.
          Independent expert review is pending.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {roles.map(([id, title]) => (
            <li key={id}>
              <a
                className="block rounded-xl border border-border bg-card p-5 font-semibold text-primary underline"
                href={`/interview-guides/${id}`}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
