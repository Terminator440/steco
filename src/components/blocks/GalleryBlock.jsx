import { withSupabaseImageParams } from "../../lib/imageUtils";

export function GalleryBlock({ data }) {
  const images = data?.images || [];
  if (!images.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-slate-50 sm:text-3xl">
          {data.heading || "Galerie foto"}
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, idx) => (
          <div
            key={img.id || img.url || idx}
            className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-slate-700 bg-slate-200/70"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-110 bg-gradient-to-br from-slate-100 to-slate-300 blur-xl"
            />
            <img
              src={withSupabaseImageParams(img.url, { width: 900, quality: 80 })}
              alt={img.alt || "Eveniment Steco"}
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
              className="relative z-10 h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
