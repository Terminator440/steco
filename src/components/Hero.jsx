import { Link } from "react-router-dom";
import { buildSupabaseSrcSet, withSupabaseImageParams } from "../lib/imageUtils";
import { Branch } from "./Brand";

const FALLBACK_IMAGE =
  "https://images.pexels.com/photos/169211/pexels-photo-169211.jpeg?auto=compress&cs=tinysrgb&w=1400";

// "feature" = prima pagină (imagine + crenguța animată); "page" = antet pentru paginile interioare.
export function Hero({ title, subtitle, imageUrl, ctaLabel, ctaHref, variant = "feature" }) {
  if (variant === "page") {
    return <PageHeader title={title} subtitle={subtitle} imageUrl={imageUrl} ctaLabel={ctaLabel} ctaHref={ctaHref} />;
  }

  const heroSource = withSupabaseImageParams(imageUrl, { width: 1280, quality: 80 });
  const heroSrcSet = buildSupabaseSrcSet(imageUrl, [640, 960, 1280, 1600], 80);

  return (
    <section className="relative overflow-hidden pt-24 lg:min-h-[100svh] lg:pt-0">
      <div className="axis-line hidden lg:block" />
      <Branch className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[min(78vh,640px)] -translate-x-1/2 -translate-y-1/2 text-ink lg:block" />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 sm:px-8 lg:min-h-[100svh] lg:grid-cols-2 lg:gap-0 lg:pb-0">
        <div className="flex flex-col justify-center lg:py-32 lg:pr-24">
          <h1 className="type-h1 hero-rise max-w-[13ch]" style={{ "--d": "0.2s" }}>
            {title || "Evenimentul tău, regizat la perfecțiune."}
          </h1>

          <p className="hero-rise mt-7 max-w-[42ch] text-lg text-ink-soft" style={{ "--d": "0.45s" }}>
            {subtitle ||
              "De la concept la ultima lumânare stinsă, Steco Events este partenerul tău pentru evenimente impecabile."}
          </p>

          <div className="hero-rise mt-10 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--d": "0.65s" }}>
            <Link to={ctaHref || "/contact"} className="btn-primary">
              {ctaLabel || "Programează o discuție"}
            </Link>
            <Link
              to="/portofoliu"
              className="border-b border-ink/30 pb-0.5 text-[0.9375rem] font-medium text-ink transition-colors hover:border-magenta hover:text-magenta"
            >
              Vezi portofoliul
            </Link>
          </div>

          <p
            className="hero-rise mt-14 max-w-[46ch] border-t border-line pt-6 text-[0.9375rem] text-ink-soft"
            style={{ "--d": "0.8s" }}
          >
            Peste 10 ani de nunți, botezuri, majorate și evenimente corporate. Ne ocupăm de concept, logistică și
            coordonarea din ziua evenimentului.
          </p>
        </div>

        <div className="flex items-center lg:py-28 lg:pl-24">
          <figure className="hero-rise relative w-full" style={{ "--d": "0.1s" }}>
            <div className="aspect-[4/5] w-full overflow-hidden bg-blush lg:max-h-[74vh]">
              <img
                src={heroSource || FALLBACK_IMAGE}
                srcSet={heroSrcSet || undefined}
                sizes="(max-width: 1024px) 92vw, 600px"
                alt="Masă festivă aranjată de Steco Events"
                width="1200"
                height="1500"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
          </figure>
        </div>
      </div>
    </section>
  );
}

function PageHeader({ title, subtitle, imageUrl, ctaLabel, ctaHref }) {
  const source = withSupabaseImageParams(imageUrl, { width: 1600, quality: 80 });
  const srcSet = buildSupabaseSrcSet(imageUrl, [960, 1280, 1600, 2000], 80);

  return (
    <section className="pt-32 sm:pt-40">
      <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-14 sm:px-8 lg:grid-cols-2 lg:gap-0 lg:pb-20">
        <div className="axis-line hidden lg:block" />
        <h1 className="type-h1 hero-rise lg:pr-16" style={{ "--d": "0.05s" }}>
          {title}
        </h1>
        <div className="hero-rise flex flex-col justify-end lg:pl-16" style={{ "--d": "0.25s" }}>
          {subtitle && <p className="type-lede max-w-[38ch] text-ink-soft">{subtitle}</p>}
          {ctaLabel && (
            <div className="mt-8">
              <Link to={ctaHref || "/contact"} className="btn-primary">
                {ctaLabel}
              </Link>
            </div>
          )}
        </div>
      </div>

      {source && (
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-8">
          <div className="aspect-[16/9] overflow-hidden bg-blush sm:aspect-[21/9]">
            <img
              src={source}
              srcSet={srcSet || undefined}
              sizes="(max-width: 1280px) 100vw, 1280px"
              alt=""
              width="2100"
              height="900"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}
    </section>
  );
}
