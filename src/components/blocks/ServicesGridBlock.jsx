export function ServicesGridBlock({ data }) {
  const items = data?.items || [];

  if (!data || !Array.isArray(items)) {
    return (
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-2xl p-4 text-center text-sm text-slate-300">
          Încarcare servicii...
        </div>
      </section>
    );
  }

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-slate-50 sm:text-3xl">
          {data.heading || "Serviciile noastre"}
        </h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, idx) => (
          <div key={item.id || idx} className="glass-panel flex h-full flex-col rounded-2xl p-5 text-center">
            {/* Icon-urile au fost eliminate pentru a evita upload/randări nedorite */}
            <h3 className="font-semibold text-slate-50">{item.title}</h3>
            <p className="mt-2 text-xs text-slate-300 sm:text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
