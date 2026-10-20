import { Link } from "react-router-dom";
import { spreadImages, useAllBlocks } from "../../lib/content";
import { withSupabaseImageParams } from "../../lib/imageUtils";

// Invitația de la finalul paginilor: o întrebare mare și un singur link.
export function Invitation() {
  const { blocks } = useAllBlocks();
  // Ultimele poze din colaj, ca să nu repete ce s-a văzut deja în antet.
  const [left, right] = spreadImages(blocks, 10).slice(-2);

  return (
    <section data-header="dark" className="relative isolate overflow-hidden bg-plum px-4 py-32 text-cream sm:px-8 sm:py-44">
      {left && (
        <div
          aria-hidden="true"
          className="drift absolute -left-6 top-[6%] w-[26vw] overflow-hidden sm:top-[18%] sm:w-[clamp(120px,14vw,240px)]"
          style={{ "--shift": "-14vh", aspectRatio: "4 / 5" }}
        >
          <img src={withSupabaseImageParams(left.url, { width: 500 })} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
      )}
      {right && (
        <div
          aria-hidden="true"
          className="drift absolute -right-4 bottom-[4%] w-[24vw] overflow-hidden sm:bottom-[10%] sm:w-[clamp(110px,12vw,210px)]"
          style={{ "--shift": "-26vh", aspectRatio: "1 / 1" }}
        >
          <img src={withSupabaseImageParams(right.url, { width: 500 })} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <h2 className="display display-lg reveal mx-auto max-w-[14ch] [text-wrap:balance]">Gata să sărbătorim împreună?</h2>
        <p className="reveal mx-auto mt-6 max-w-[44ch] text-cream/80">
          Spune-ne data, locul și ce îți imaginezi. Revenim cu o propunere făcută pentru evenimentul tău.
        </p>
        <div className="reveal mt-10">
          <Link to="/contact" className="link-dots">
            Planifică evenimentul
          </Link>
        </div>
      </div>
    </section>
  );
}
