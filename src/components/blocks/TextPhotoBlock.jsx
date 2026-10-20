import { withSupabaseImageParams } from "../../lib/imageUtils";
import { Paragraphs } from "./Paragraphs";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=1200";

export function TextPhotoBlock({ data }) {
  if (!data?.text && !data?.imageUrl) return null;

  const imageOnLeft = data?.imagePosition === "left";
  const imageUrl = withSupabaseImageParams(data?.imageUrl, { width: 1100, quality: 80 });

  return (
    <section className="py-16 sm:py-24">
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-8 lg:grid-cols-2 lg:gap-0">
        <div className="axis-line hidden lg:block" />

        <div className={imageOnLeft ? "lg:order-2 lg:pl-20" : "lg:pr-20"}>
          {data.title && <h2 className="type-h2 mb-6 max-w-[18ch]">{data.title}</h2>}
          <Paragraphs text={data.text} className="max-w-[60ch] space-y-4 text-ink-soft" />
        </div>

        <div className={imageOnLeft ? "lg:order-1 lg:pr-20" : "lg:pl-20"}>
          <div className="aspect-[4/5] overflow-hidden bg-blush sm:aspect-[3/2] lg:aspect-[4/5]">
            <img
              src={imageUrl || FALLBACK_IMAGE}
              alt={data.imageAlt || ""}
              width="1200"
              height="1500"
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
