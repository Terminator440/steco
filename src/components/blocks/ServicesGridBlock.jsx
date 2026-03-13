import { withSupabaseImageParams } from "../../lib/imageUtils";

export function ServicesGridBlock({ data }) {
  const items = data?.items || [];

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
            {item.iconUrl && (
              <div className="mb-3 flex justify-center">
                <div className="relative aspect-square w-10 overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 scale-110 bg-gradient-to-br from-slate-100 to-slate-300 blur-lg"
                  />
                  <img
                    src={withSupabaseImageParams(item.iconUrl, { width: 96, quality: 80 })}
                    alt={item.title || "Serviciu"}
                    width="96"
                    height="96"
                    loading="lazy"
                    decoding="async"
                    className="relative z-10 h-full w-full object-cover"
                  />
                </div>
              </div>
            )}
            <h3 className="font-semibold text-slate-50">{item.title}</h3>
            <p className="mt-2 text-xs text-slate-300 sm:text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
