import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Hero } from "./Hero";

function HeroSection({ data, fallbackTitle, fallbackSubtitle }) {
  return (
    <Hero
      title={data?.title || fallbackTitle}
      subtitle={data?.subtitle || fallbackSubtitle}
      imageUrl={data?.backgroundImageUrl}
      ctaLabel={data?.ctaLabel}
      ctaHref={data?.ctaHref}
    />
  );
}

function ServicesGridSection({ data }) {
  const items = data?.items || [];

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-slate-50 sm:text-3xl">
          {data.heading || "Serviciile noastre"}
        </h2>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          {data.subheading ||
            "Concepute pentru a acoperi fiecare detaliu al evenimentului tău."}
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="glass-panel flex h-full flex-col rounded-2xl p-5 text-center"
          >
            {item.iconUrl && (
              <div className="mb-3 flex justify-center">
                <img
                  src={item.iconUrl}
                  alt={item.title || "Serviciu"}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </div>
            )}
            <h3 className="font-semibold text-slate-50">{item.title}</h3>
            <p className="mt-2 text-xs text-slate-300 sm:text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GallerySection({ data }) {
  const images = data?.images || [];
  if (!images.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-slate-50 sm:text-3xl">
          {data.heading || "Galerie foto"}
        </h2>
        <p className="mt-2 text-sm text-slate-300 sm:text-base">
          {data.subheading || "Fragmente din evenimentele Steco."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, idx) => (
          <div
            key={img.url || idx}
            className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60"
          >
            <img src={img.url} alt={img.alt || "Eveniment Steco"} className="h-56 w-full object-cover" />
          </div>
        ))}
      </div>
    </section>
  );
}

function TextBlockSection({ data }) {
  if (!data?.text) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-3xl p-6 sm:p-8">
        {data.heading && (
          <h2 className="mb-3 font-display text-xl text-slate-50 sm:text-2xl">{data.heading}</h2>
        )}
        <p className="text-sm text-slate-200 sm:text-base" style={{ whiteSpace: "pre-line" }}>
          {data.text}
        </p>
      </div>
    </section>
  );
}

function SectionManager({ sections, defaults }) {
  if (!sections?.length) {
    return (
      <>
        <HeroSection data={null} fallbackTitle={defaults.title} fallbackSubtitle={defaults.subtitle} />
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            <p className="text-sm text-slate-300 sm:text-base">
              Nu există încă secțiuni definite pentru această pagină. Intră în{" "}
              <span className="font-semibold text-yellow-400">Admin</span> pentru a le configura în{" "}
              <code className="font-mono">steco_page_content</code>.
            </p>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {sections.map((section) => {
        const key = section.id || `${section.section_type}-${section.order_index}`;

        if (section.section_type === "hero") {
          return (
            <HeroSection
              key={key}
              data={section.data}
              fallbackTitle={defaults.title}
              fallbackSubtitle={defaults.subtitle}
            />
          );
        }

        if (section.section_type === "services_grid") {
          return <ServicesGridSection key={key} data={section.data} />;
        }

        if (section.section_type === "gallery") {
          return <GallerySection key={key} data={section.data} />;
        }

        if (section.section_type === "text_block") {
          return <TextBlockSection key={key} data={section.data} />;
        }

        return null;
      })}
    </>
  );
}

export function DynamicPage({ slug, defaultTitle, defaultSubtitle }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sections, setSections] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchSections() {
      setLoading(true);
      setError("");

      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error: supaError } = await supabase
          .from("steco_page_content")
          .select("id,page_slug,section_type,order_index,data")
          .eq("page_slug", slug)
          .order("order_index", { ascending: true });

        if (!isMounted) return;

        if (supaError) {
          setError("A apărut o eroare la încărcarea conținutului.");
        } else {
          setSections(data || []);
        }
      } catch {
        if (isMounted) {
          setError("Nu s-a putut încărca conținutul.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSections();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return (
    <main className="min-h-screen bg-black">
      {error && (
        <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6 lg:px-8">
          <p className="mb-4 rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
            {error}
          </p>
        </div>
      )}

      {loading && (
        <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400">
            Se încarcă secțiunile pentru pagina <code className="font-mono">{slug}</code>...
          </p>
        </div>
      )}

      <SectionManager
        sections={sections}
        defaults={{ title: defaultTitle, subtitle: defaultSubtitle }}
      />
    </main>
  );
}

