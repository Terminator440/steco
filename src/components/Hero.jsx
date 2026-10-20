import { Link } from "react-router-dom";
import { withSupabaseImageParams } from "../lib/imageUtils";

// Pozițiile colajului: pozele stau pe margini, titlul rămâne liber în centru.
// Pe telefon coboară în benzile de sus și de jos, ca să nu acopere titlul.
// --shift dă viteza diferită a fiecărei poze la scroll (parallax pe GPU, vezi index.css).
const HOME_SLOTS = [
  { cls: "left-0 -top-[2%] w-[30vw] sm:-top-[4%] sm:w-[15vw] max-w-[270px]", ratio: "4 / 5", shift: "-34vh" },
  { cls: "right-[6%] top-[9%] w-[26vw] sm:right-[13%] sm:w-[12vw] max-w-[220px]", ratio: "1 / 1", shift: "-16vh" },
  { cls: "left-[4%] bottom-[7%] w-[38vw] sm:bottom-auto sm:top-[58%] sm:w-[19vw] max-w-[340px]", ratio: "4 / 3", shift: "-48vh" },
  { cls: "right-0 bottom-[17%] w-[28vw] sm:bottom-auto sm:top-[47%] sm:w-[14vw] max-w-[250px]", ratio: "4 / 5", shift: "-26vh" },
  { cls: "left-[46%] -bottom-[6%] w-[30vw] sm:left-[44%] sm:-bottom-[9%] sm:w-[14vw] max-w-[250px]", ratio: "4 / 3", shift: "-62vh" },
  { cls: "left-[40%] top-[17%] w-[16vw] sm:left-[27%] sm:top-[6%] sm:w-[9vw] max-w-[160px]", ratio: "3 / 4", shift: "-10vh" }
];

const PAGE_SLOTS = [
  { cls: "left-[2%] top-[10%] w-[20vw] sm:top-[16%] sm:w-[11vw] max-w-[190px]", ratio: "4 / 5", shift: "-22vh" },
  { cls: "right-[4%] top-[14%] w-[18vw] sm:top-[26%] sm:w-[12vw] max-w-[210px]", ratio: "1 / 1", shift: "-36vh" },
  { cls: "left-[6%] -bottom-[4%] w-[24vw] sm:left-[12%] sm:-bottom-[6%] sm:w-[13vw] max-w-[230px]", ratio: "4 / 3", shift: "-14vh" },
  { cls: "right-[10%] -bottom-[8%] w-[16vw] sm:right-[18%] sm:-bottom-[10%] sm:w-[9vw] max-w-[160px]", ratio: "3 / 4", shift: "-44vh" }
];

function Collage({ images, slots, eager = false }) {
  return images.slice(0, slots.length).map((img, idx) => {
    const slot = slots[idx];
    return (
      <div
        key={img.url}
        aria-hidden="true"
        className={`parallax absolute overflow-hidden bg-night/40 ${slot.cls}`}
        style={{ aspectRatio: slot.ratio, "--shift": slot.shift }}
      >
        <img
          src={withSupabaseImageParams(img.url, { width: 600, quality: 75 })}
          alt=""
          loading={eager && idx < 3 ? "eager" : "lazy"}
          decoding="async"
          className="page-in h-full w-full object-cover"
          style={{ "--d": `${0.15 + idx * 0.08}s` }}
        />
      </div>
    );
  });
}

function titleSize(title) {
  // Titlurile lungi coboară o treaptă, ca să nu ocupe mai mult de trei-patru rânduri.
  return String(title || "").length > 26 ? "display-lg" : "display-xl";
}

export function Hero({ title, subtitle, ctaLabel, ctaHref, images = [] }) {
  const heading = title || "Evenimentul tău, regizat la perfecțiune.";

  return (
    <section data-header="dark" className="relative isolate flex min-h-[640px] h-[100svh] items-center justify-center overflow-hidden bg-plum text-cream">
      <Collage images={images} slots={HOME_SLOTS} eager />

      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-8">
        <h1 className={`display ${titleSize(heading)} page-in mx-auto max-w-[15ch] [text-wrap:balance]`}>
          {heading}
        </h1>
        {subtitle && (
          <p className="page-in mx-auto mt-6 max-w-[46ch] text-cream/80" style={{ "--d": "0.2s" }}>
            {subtitle}
          </p>
        )}
        <div className="page-in mt-9" style={{ "--d": "0.3s" }}>
          <Link to={ctaHref || "/contact"} className="link-dots">
            {ctaLabel || "Planifică evenimentul"}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function PageHeader({ title, subtitle, ctaLabel, ctaHref, images = [] }) {
  return (
    <section
      data-header="dark"
      className="relative isolate flex min-h-[78svh] items-center justify-center overflow-hidden bg-plum px-4 pb-24 pt-36 text-cream sm:px-8"
    >
      <Collage images={images} slots={PAGE_SLOTS} />

      <div className="relative z-10 mx-auto max-w-5xl text-center">
        <h1 className="display display-lg page-in mx-auto max-w-[18ch] [text-wrap:balance]">{title}</h1>
        {subtitle && (
          <p className="page-in mx-auto mt-7 max-w-[52ch] text-lg text-cream/80" style={{ "--d": "0.15s" }}>
            {subtitle}
          </p>
        )}
        {ctaLabel && (
          <div className="page-in mt-9" style={{ "--d": "0.25s" }}>
            <Link to={ctaHref || "/contact"} className="link-dots">
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
