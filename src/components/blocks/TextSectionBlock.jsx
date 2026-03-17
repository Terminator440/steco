export function TextSectionBlock({ data }) {
  const text = data?.text || "";

  if (!text) return null;

  return (
    <section className="mx-auto max-w-4xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-800/70 bg-slate-950/80 p-6 sm:p-10 shadow-elegant">
        <div className="text-sm leading-relaxed text-slate-200 sm:text-base" style={{ whiteSpace: "pre-line" }}>
          {text}
        </div>
      </div>
    </section>
  );
}

