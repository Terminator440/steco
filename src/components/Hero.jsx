import { Link } from "react-router-dom";

export function Hero({ title, subtitle, imageUrl, ctaLabel, ctaHref }) {
  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-32 sm:pb-28">
      <div className="absolute inset-0 gradient-hero" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-12 px-4 sm:px-6 lg:flex-row lg:px-8">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          <p className="inline-flex items-center rounded-full border border-yellow-500/40 bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-yellow-400">
            Steco Events · Experiențe memorabile
          </p>

          <h1 className="font-display text-3xl leading-tight text-slate-50 sm:text-4xl lg:text-5xl">
            {title || "Evenimentul tău, regizat la perfecțiune."}
          </h1>

          <p className="max-w-xl text-sm text-slate-300 sm:text-base">
            {subtitle ||
              "De la nunți elegante la evenimente corporate impecabile, echipa Steco transformă fiecare idee într-o poveste de neuitat."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link to={ctaHref || "/contact"} className="btn-primary">
              {ctaLabel || "Programează o discuție"}
            </Link>
            <Link to="/portofoliu" className="btn-outline">
              Vezi portofoliul
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 lg:justify-start">
            <div>
              <p className="font-semibold text-slate-200">Peste 10 ani de experiență</p>
              <p>Nunți · Botezuri · Corporate · Majorate</p>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Consultanță completă</p>
              <p>Concept, logistică, coordonare în ziua evenimentului</p>
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="relative mx-auto aspect-[4/3] max-w-md overflow-hidden rounded-3xl border border-slate-700/70 bg-slate-900/60 shadow-elegant">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-transparent to-amber-500/20" />
            <img
              src={
                imageUrl ||
                "https://images.pexels.com/photos/169211/pexels-photo-169211.jpeg?auto=compress&cs=tinysrgb&w=1200"
              }
              alt="Eveniment elegant organizat de Steco Events"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 text-xs text-slate-200">
              <p className="font-semibold">Detalii perfecte, lumină caldă, atmosferă memorabilă.</p>
              <p>Exact așa va arăta și evenimentul tău.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

