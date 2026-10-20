export function ServicesGridBlock({ data }) {
  const items = Array.isArray(data?.items) ? data.items.filter((item) => item?.title || item?.description) : [];

  if (!items.length) return null;

  // Ca programul unei seri: numele serviciului în stânga axei, detaliile în dreapta.
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <h2 className="type-h2 mb-10 sm:mb-14">{data.heading || "Serviciile noastre"}</h2>

        <ul className="border-b border-line">
          {items.map((item, idx) => (
            <li
              key={item.id || idx}
              className="grid gap-3 border-t border-line py-8 sm:py-10 lg:grid-cols-2 lg:gap-0"
            >
              <h3 className="type-h3 lg:pr-16">{item.title}</h3>
              {item.description && (
                <p className="max-w-[56ch] text-ink-soft lg:border-l lg:border-line lg:pl-16" style={{ whiteSpace: "pre-line" }}>
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
