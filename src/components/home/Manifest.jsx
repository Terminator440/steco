import { Link } from "react-router-dom";
import { withSupabaseImageParams } from "../../lib/imageUtils";
import { withoutEmoji } from "../../lib/text";

// Secțiunea fixată pe ecran: fundalul trece din prună în noapte, iar fotografia urcă peste text.
// Fără suport pentru animații legate de scroll, apare ca o secțiune obișnuită (vezi .manifest în index.css).
export function Manifest({ text, imageUrl, imageAlt = "" }) {
  if (!text) return null;

  return (
    <section data-header="dark" className="manifest relative bg-plum text-cream">
      <div className="manifest-stage relative flex flex-col items-center justify-center gap-10 overflow-hidden px-4 py-28 sm:px-8">
        <div className="manifest-night absolute inset-0 bg-night opacity-0" aria-hidden="true" />

        <p className="manifest-text display display-md relative z-10 mx-auto max-w-[24ch] text-center [text-wrap:balance]">
          {withoutEmoji(text)}
        </p>

        <Link to="/misiunea-noastra" className="btn-round relative z-10">
          Despre noi
        </Link>

        {imageUrl && (
          <figure className="manifest-photo relative z-20 w-[clamp(180px,24vw,360px)] overflow-hidden bg-night">
            <img
              src={withSupabaseImageParams(imageUrl, { width: 720, quality: 80 })}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] h-full w-full object-cover"
            />
          </figure>
        )}
      </div>
    </section>
  );
}
