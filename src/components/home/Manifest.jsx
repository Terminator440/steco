import { Link } from "react-router-dom";
import { withSupabaseImageParams } from "../../lib/imageUtils";
import { withoutEmoji } from "../../lib/text";

// Secțiunea fixată pe ecran: fundalul trece din prună în noapte, iar fotografia urcă peste text.
// Fără suport pentru animații legate de scroll, apare ca o secțiune obișnuită (vezi .manifest în index.css).
// Fără fotografie nu are ce urca, așa că nu o mai fixăm: altfel ar rămâne un ecran și jumătate de scroll gol.
export function Manifest({ text, imageUrl, imageAlt = "" }) {
  if (!text) return null;

  const pinned = Boolean(imageUrl);
  const statement = withoutEmoji(text);
  // Un text lung, scris numai cu majuscule, se citește greu; la o frază scurtă păstrăm majusculele.
  const textCase = statement.length > 140 ? "normal-case" : "";

  if (!pinned) {
    return (
      <section data-header="dark" className="bg-plum px-4 pb-32 pt-16 text-cream sm:px-8 sm:pb-44 sm:pt-24">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center gap-10">
          <p className={`display display-md reveal mx-auto max-w-[30ch] text-center [text-wrap:balance] ${textCase}`}>
            {statement}
          </p>
          <Link to="/misiunea-noastra" className="btn-round reveal">
            Despre noi
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section data-header="dark" className="manifest relative bg-plum text-cream">
      <div className="manifest-stage relative flex flex-col items-center justify-center gap-10 overflow-hidden px-4 py-28 sm:px-8">
        <div className="manifest-night absolute inset-0 bg-night opacity-0" aria-hidden="true" />

        <p className={`manifest-text display display-md relative z-10 mx-auto max-w-[24ch] text-center [text-wrap:balance] ${textCase}`}>
          {statement}
        </p>

        <Link to="/misiunea-noastra" className="btn-round relative z-10">
          Despre noi
        </Link>

        <figure className="manifest-photo relative z-20 w-[clamp(180px,24vw,360px)] overflow-hidden bg-night">
          <img
            src={withSupabaseImageParams(imageUrl, { width: 720, quality: 80 })}
            alt={imageAlt}
            loading="lazy"
            decoding="async"
            className="aspect-[4/5] h-full w-full object-cover"
          />
        </figure>
      </div>
    </section>
  );
}
