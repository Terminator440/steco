import { withSupabaseImageParams } from "../../lib/imageUtils";
import { withoutEmoji } from "../../lib/text";
import { Paragraphs } from "./Paragraphs";

export function TextPhotoBlock({ data }) {
  if (!data?.text && !data?.imageUrl) return null;

  const imageOnLeft = data?.imagePosition === "left";
  const imageUrl = withSupabaseImageParams(data?.imageUrl, { width: 1100, quality: 80 });

  // Fără poză, textul stă centrat pe o coloană, nu în jumătatea stângă a unei grile cu dreapta goală.
  if (!imageUrl) {
    return (
      <section data-header="light" className="bg-paper px-4 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-[60ch]">
          {data.title && <h2 className="display display-md reveal mb-8 text-center [text-wrap:balance]">{withoutEmoji(data.title)}</h2>}
          <Paragraphs text={data.text} className="reveal space-y-4 text-lg text-ink-soft" />
        </div>
      </section>
    );
  }

  return (
    <section data-header="light" className="overflow-hidden bg-paper px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto grid max-w-[1400px] items-center gap-12 lg:grid-cols-2 lg:gap-20">
        <div className={imageOnLeft ? "lg:order-2" : ""}>
          {data.title && <h2 className="display display-md reveal max-w-[16ch]">{withoutEmoji(data.title)}</h2>}
          <Paragraphs text={data.text} className="reveal mt-8 max-w-[52ch] space-y-4 text-lg text-ink-soft" />
        </div>

        {imageUrl && (
          <div className={imageOnLeft ? "lg:order-1" : ""}>
            <div className="drift mx-auto aspect-[4/5] max-w-[520px] overflow-hidden bg-blush" style={{ "--shift": "-10vh" }}>
              <img
                src={imageUrl}
                alt={data.imageAlt || ""}
                width="1100"
                height="1375"
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
