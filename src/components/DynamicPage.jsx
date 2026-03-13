import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Hero } from "./Hero";

function HeroBlock({ data, fallbackTitle, fallbackSubtitle }) {
  return (
    <Hero
      title={data?.title || fallbackTitle}
      subtitle={data?.subtitle || fallbackSubtitle}
      imageUrl={data?.backgroundImageUrl}
      ctaLabel={data?.buttonLabel}
      ctaHref={data?.buttonHref}
    />
  );
}

function TextPhotoBlock({ data }) {
  if (!data?.text && !data?.imageUrl) return null;

  const imageOnLeft = data?.imagePosition === "left";

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className={imageOnLeft ? "order-2 lg:order-2" : "order-2 lg:order-1"}>
          <div className="glass-panel rounded-3xl p-6 sm:p-8">
            {data.title && (
              <h2 className="mb-3 font-display text-2xl text-slate-50 sm:text-3xl">
                {data.title}
              </h2>
            )}
            <p className="text-sm text-slate-200 sm:text-base" style={{ whiteSpace: "pre-line" }}>
              {data.text}
            </p>
          </div>
        </div>

        <div className={imageOnLeft ? "order-1 lg:order-1" : "order-1 lg:order-2"}>
          <div className="overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/60">
            <img
              src={
                data.imageUrl ||
                "https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg?auto=compress&cs=tinysrgb&w=1200"
              }
              alt={data.imageAlt || "Text și foto Steco"}
              className="h-72 w-full object-cover sm:h-96"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesGridBlock({ data }) {
  const items = data?.items || [];

  if (!items.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-slate-50 sm:text-3xl">
          {data.heading || "Serviciile noastre"}
        </h2>
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

function GalleryBlock({ data }) {
  const images = data?.images || [];
  if (!images.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-6 text-center">
        <h2 className="font-display text-2xl text-slate-50 sm:text-3xl">
          {data.heading || "Galerie foto"}
        </h2>
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

function BlockManager({ blocks, defaults }) {
  if (!blocks?.length) {
    return (
      <>
        <HeroBlock data={null} fallbackTitle={defaults.title} fallbackSubtitle={defaults.subtitle} />
        <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 text-center">
            <p className="text-sm text-slate-300 sm:text-base">
              Nu există încă secțiuni definite pentru această pagină.
            </p>
            <p className="text-xs text-slate-400 sm:text-sm">
              Dacă ești administrator, poți construi prima secțiune din panoul{" "}
              <span className="font-semibold text-rose-400">Admin</span>.
            </p>
            <div className="flex justify-center">
              <a
                href="/admin"
                className="inline-flex items-center justify-center rounded-full border border-rose-500 px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-100 hover:bg-rose-500/10"
              >
                Construiește prima secțiune
              </a>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {blocks.map((block) => {
        const key = block.id || `${block.block_type}-${block.order_index}`;

        if (block.block_type === "hero") {
          return (
            <HeroBlock
              key={key}
              data={block.data}
              fallbackTitle={defaults.title}
              fallbackSubtitle={defaults.subtitle}
            />
          );
        }

        if (block.block_type === "text_photo") {
          return <TextPhotoBlock key={key} data={block.data} />;
        }

        if (block.block_type === "services_grid") {
          return <ServicesGridBlock key={key} data={block.data} />;
        }

        if (block.block_type === "gallery") {
          return <GalleryBlock key={key} data={block.data} />;
        }

        return null;
      })}
    </>
  );
}

export function DynamicPage({ slug, defaultTitle, defaultSubtitle }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchBlocks() {
      setLoading(true);
      setError("");

      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error: supaError } = await supabase
          .from("steco_page_blocks")
          .select("id,page_slug,block_type,block_data,order_index")
          .eq("page_slug", slug)
          .order("order_index", { ascending: true });

        if (!isMounted) return;

        if (supaError) {
          setError("A apărut o eroare la încărcarea conținutului.");
        } else {
          const mapped = (data || []).map((row) => ({
            id: row.id,
            page_slug: row.page_slug,
            block_type: row.block_type,
            order_index: row.order_index ?? 0,
            data: row.block_data || {}
          }));
          setBlocks(mapped);
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

    fetchBlocks();

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
            Se încarcă blocurile pentru pagina <code className="font-mono">{slug}</code>...
          </p>
        </div>
      )}

      <BlockManager
        blocks={blocks}
        defaults={{ title: defaultTitle, subtitle: defaultSubtitle }}
      />
    </main>
  );
}

