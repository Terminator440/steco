import { useCallback, useEffect, useRef, useState } from "react";
import { withSupabaseImageParams } from "../../lib/imageUtils";

// Fiecare a șasea fotografie ocupă un spațiu dublu, ca într-un album, nu ca într-un tabel.
function tileClass(idx) {
  if (idx % 6 === 0) return "col-span-2 row-span-2";
  if (idx % 6 === 4) return "row-span-2";
  return "";
}

export function GalleryBlock({ data }) {
  const images = (data?.images || []).filter((img) => img?.url);
  const dialogRef = useRef(null);
  const [active, setActive] = useState(null);

  const open = (idx) => {
    setActive(idx);
    dialogRef.current?.showModal();
  };

  const close = () => dialogRef.current?.close();

  const step = useCallback(
    (delta) => setActive((current) => (current === null ? current : (current + delta + images.length) % images.length)),
    [images.length]
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
  }, [step]);

  if (!images.length) return null;

  const current = active !== null ? images[active] : null;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 sm:mb-14">
          <h2 className="type-h2">{data.heading || "Galerie foto"}</h2>
          <p className="text-[0.9375rem] text-ink-soft">{images.length} fotografii. Apasă pe una ca să o vezi mare.</p>
        </div>

        <ul className="grid auto-rows-[44vw] grid-cols-2 gap-2 [grid-auto-flow:dense] sm:auto-rows-[200px] sm:gap-3 md:grid-cols-4 lg:auto-rows-[240px]">
          {images.map((img, idx) => (
            <li key={img.id || img.url || idx} className={tileClass(idx)}>
              <button
                type="button"
                onClick={() => open(idx)}
                className="group block h-full w-full overflow-hidden bg-blush"
                aria-label={`Deschide fotografia ${idx + 1}${img.alt ? `: ${img.alt}` : ""}`}
              >
                <img
                  src={withSupabaseImageParams(img.url, { width: idx % 6 === 0 ? 1200 : 700, quality: 80 })}
                  alt={img.alt || ""}
                  width="1200"
                  height="800"
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="lightbox m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-paper"
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
    </section>
  );
}
