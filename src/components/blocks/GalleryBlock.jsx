import { useCallback, useEffect, useId, useRef, useState } from "react";
import { withSupabaseImageParams } from "../../lib/imageUtils";
import { withoutEmoji } from "../../lib/text";

// Ritmul benzii: portret, peisaj, portret... cu dimensiuni fixe, ca pagina să nu sară la încărcare.
const TILE_RATIOS = ["4 / 5", "4 / 3", "3 / 4"];

// Pe desktop, banda se poate trage cu mouse-ul. Pe telefon rămâne scroll-ul nativ cu degetul.
function useDragScroll(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    let moved = false;

    const onDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      dragging = true;
      moved = false;
      startX = event.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (event) => {
      if (!dragging) return;
      const dx = event.clientX - startX;
      if (Math.abs(dx) > 5) moved = true;
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      dragging = false;
    };
    const onClick = (event) => {
      if (moved) {
        event.preventDefault();
        event.stopPropagation();
        moved = false;
      }
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, [ref]);
}

function Lightbox({ images, dialogRef, active, setActive }) {
  const close = () => dialogRef.current?.close();

  const step = useCallback(
    (delta) => setActive((current) => (current === null ? current : (current + delta + images.length) % images.length)),
    [images.length, setActive]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const onKey = (event) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    const onClose = () => setActive(null);

    dialog.addEventListener("keydown", onKey);
    dialog.addEventListener("close", onClose);
    return () => {
      dialog.removeEventListener("keydown", onKey);
      dialog.removeEventListener("close", onClose);
    };
  }, [dialogRef, setActive, step]);

  const current = active !== null ? images[active] : null;

  return (
    <dialog
      ref={dialogRef}
      className="lightbox m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-cream"
      aria-label="Fotografie mărită"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      {current && (
        <div className="flex h-full flex-col" onClick={(event) => event.target === event.currentTarget && close()}>
          <div className="flex items-center justify-between px-4 py-4 text-[0.9375rem] sm:px-8">
            <span>
              {active + 1} din {images.length}
            </span>
            <button type="button" onClick={close} className="px-2 py-1 hover:text-blush">
              Închide
            </button>
          </div>
          <div
            className="flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20"
            onClick={(event) => event.target === event.currentTarget && close()}
          >
            <img
              src={withSupabaseImageParams(current.url, { width: 1800, quality: 85 })}
              alt={current.alt || ""}
              className="max-h-full max-w-full object-contain"
            />
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-8 py-5 text-[0.9375rem]">
              <button type="button" onClick={() => step(-1)} className="px-2 py-1 hover:text-blush">
                Anterioara
              </button>
              <button type="button" onClick={() => step(1)} className="px-2 py-1 hover:text-blush">
                Următoarea
              </button>
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

export function GalleryBlock({ data, description }) {
  const images = (data?.images || []).filter((img) => img?.url);
  const stripRef = useRef(null);
  const dialogRef = useRef(null);
  const [active, setActive] = useState(null);
  const timeline = `--strip-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;

  useDragScroll(stripRef);

  if (!images.length) return null;

  const heading = withoutEmoji(data.heading) || "Galerie foto";
  const text = description || "";

  const open = (idx) => {
    setActive(idx);
    dialogRef.current?.showModal();
  };

  return (
    <section data-header="light" className="bg-paper py-20 sm:py-28" style={{ timelineScope: timeline }}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8">
        <h2 className="display display-lg reveal flex flex-wrap items-center gap-x-5 gap-y-3">
          <span>{heading}</span>
          <span aria-hidden="true" className="inline-block h-[0.82em] w-[1.5em] overflow-hidden bg-blush">
            <img
              src={withSupabaseImageParams(images[0].url, { width: 300 })}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </span>
        </h2>
      </div>

      <div className="mx-auto mt-10 grid max-w-[1400px] gap-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-end lg:gap-14 lg:pr-8">
        <div className="min-w-0">
          <ul
            ref={stripRef}
            data-strip
            tabIndex={0}
            aria-label={`Fotografii ${heading}. Derulează orizontal.`}
            className="no-scrollbar flex cursor-grab snap-x gap-3 overflow-x-auto overscroll-x-contain px-4 select-none active:cursor-grabbing sm:px-8 lg:pr-0 [@media(pointer:coarse)]:snap-mandatory"
            style={{ scrollTimeline: `${timeline} inline` }}
          >
            {images.map((img, idx) => (
              <li key={img.id || img.url || idx} className="shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => open(idx)}
                  className="group block h-[clamp(260px,54vh,540px)] overflow-hidden bg-blush"
                  style={{ aspectRatio: TILE_RATIOS[idx % TILE_RATIOS.length] }}
                  aria-label={`Deschide fotografia ${idx + 1} din ${images.length}`}
                >
                  <img
                    src={withSupabaseImageParams(img.url, { width: 900, quality: 80 })}
                    alt=""
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </button>
              </li>
            ))}
          </ul>

          {images.length > 2 && (
            <div className="mt-6 flex items-center gap-4 px-4 text-[0.875rem] text-ink-soft sm:px-8">
              <span className="[@media(pointer:coarse)]:hidden">Trage sau derulează pozele</span>
              <span className="hidden [@media(pointer:coarse)]:inline">Glisează pentru mai multe poze</span>
              <span className="relative block h-px w-32 overflow-hidden bg-ink/15">
                <span
                  data-strip-bar
                  className="strip-progress absolute inset-0 origin-left scale-x-[0.08] bg-ink"
                  style={{ "--strip": timeline }}
                />
              </span>
            </div>
          )}
        </div>

        {text && (
          <p className="reveal max-w-[40ch] px-4 text-ink-soft sm:px-8 lg:px-0" style={{ whiteSpace: "pre-line" }}>
            {text}
          </p>
        )}
      </div>

      <Lightbox images={images} dialogRef={dialogRef} active={active} setActive={setActive} />
    </section>
  );
}
