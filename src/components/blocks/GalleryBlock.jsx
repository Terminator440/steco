import { useCallback, useEffect, useId, useRef, useState } from "react";
import { anchorFor } from "../../lib/eventTypes";
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

function Arrow({ back = false }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-5 w-5 ${back ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function Lightbox({ images, dialogRef, active, setActive }) {
  const swipe = useRef(null);
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
          {/* Pe telefon pozele se schimbă și cu degetul, spre stânga sau spre dreapta. */}
          <div
            className="flex min-h-0 flex-1 items-center justify-center px-4 sm:px-20"
            style={{ touchAction: "pan-y pinch-zoom" }}
            onPointerDown={(event) => {
              swipe.current = event.pointerType === "mouse" ? null : { x: event.clientX, done: false };
            }}
            onPointerCancel={() => {
              swipe.current = null;
            }}
            onPointerUp={(event) => {
              const start = swipe.current;
              if (!start) return;
              const dx = event.clientX - start.x;
              if (Math.abs(dx) > 50 && images.length > 1) {
                start.done = true;
                step(dx < 0 ? 1 : -1);
              }
            }}
            onClick={(event) => {
              const swiped = swipe.current?.done;
              swipe.current = null;
              if (!swiped && event.target === event.currentTarget) close();
            }}
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

  // Butoanele de lângă bandă, pentru cine folosește mouse-ul: avansează cam un ecran de poze.
  const scrollStrip = (direction) => {
    const strip = stripRef.current;
    if (!strip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollBy({ left: direction * strip.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section
      id={anchorFor(heading) || undefined}
      data-header="light"
      className="bg-paper py-20 sm:py-28"
      style={{ timelineScope: timeline }}
    >
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
            className="no-scrollbar flex cursor-grab snap-x scroll-pl-4 gap-3 overflow-x-auto overscroll-x-contain px-4 select-none active:cursor-grabbing sm:scroll-pl-8 sm:px-8 lg:pr-0 [@media(pointer:coarse)]:snap-mandatory"
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
              <div className="ml-auto flex gap-2 [@media(pointer:coarse)]:hidden">
                {[
                  { direction: -1, label: "Pozele anterioare" },
                  { direction: 1, label: "Pozele următoare" }
                ].map(({ direction, label }) => (
                  <button
                    key={direction}
                    type="button"
                    onClick={() => scrollStrip(direction)}
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/25 text-ink transition-colors hover:border-magenta hover:bg-magenta hover:text-cream"
                  >
                    <Arrow back={direction < 0} />
                  </button>
                ))}
              </div>
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
