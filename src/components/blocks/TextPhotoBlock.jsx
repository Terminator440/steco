import { withSupabaseImageParams } from "../../lib/imageUtils";

export function TextPhotoBlock({ data }) {
  if (!data?.text && !data?.imageUrl) return null;

  const imageOnLeft = data?.imagePosition === "left";
  const imageUrl = withSupabaseImageParams(data?.imageUrl, { width: 960, quality: 80 });

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className={imageOnLeft ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            {data.title && (
              <h2 className="mb-3 font-display text-2xl text-slate-50 sm:text-3xl">
                {data.title}
              </h2>
            )}
            <p className="text-sm text-slate-200 sm:text-base" style={{ whiteSpace: "pre-line" }}>
              {data.text}
            </p>
          </div>
        </div>

        <div className={imageOnLeft ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
          <div className="aspect-[3/2] overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/60">
            <img
              src={
                imageUrl ||
                "https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=1200"
              }
              alt={data.imageAlt || "Text și foto Steco"}
              width="1200"
              height="800"
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
