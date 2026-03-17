import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Hero } from "./Hero";

const TextPhotoBlock = lazy(() =>
  import("./blocks/TextPhotoBlock").then((module) => ({ default: module.TextPhotoBlock }))
);
const ServicesGridBlock = lazy(() =>
  import("./blocks/ServicesGridBlock").then((module) => ({ default: module.ServicesGridBlock }))
);
const GalleryBlock = lazy(() =>
  import("./blocks/GalleryBlock").then((module) => ({ default: module.GalleryBlock }))
);

function HeroBlock({ data, fallbackTitle, fallbackSubtitle, slug, blockType }) {
  return (
    <Hero
      title={data?.title || fallbackTitle}
      subtitle={data?.subtitle || fallbackSubtitle}
      imageUrl={data?.backgroundImageUrl}
      ctaLabel={data?.buttonLabel}
      ctaHref={data?.buttonHref}
      blockType={blockType || slug || "hero"}
    />
  );
}

function BlockFallback() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-2xl p-4 text-xs text-slate-300">Se încarcă secțiunea...</div>
    </section>
  );
}

function DefaultContent({ defaults, slug }) {
  return (
    <>
      <HeroBlock
        data={null}
        fallbackTitle={defaults.title}
        fallbackSubtitle={defaults.subtitle}
        slug={slug}
        blockType={slug}
      />
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

function BlockManager({ blocks, defaults, slug }) {
  if (!blocks || !blocks.length) {
    return <DefaultContent defaults={defaults} slug={slug} />;
  }

  // eslint-disable-next-line no-console
  console.log(`[Steco] BlockManager primește blocuri pentru slug "${slug}":`, blocks);

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
              slug={slug}
              blockType={block.block_type}
            />
          );
        }

        if (block.block_type === "text_photo") {
          return (
            <Suspense key={key} fallback={<BlockFallback />}>
              <TextPhotoBlock data={block.data} />
            </Suspense>
          );
        }

        if (block.block_type === "services_grid") {
          // eslint-disable-next-line no-console
          console.log("[Steco] Date primite pentru bloc services_grid:", block);

          if (!block.data || !block.data.items) {
            return null;
          }

          return (
            <Suspense key={key} fallback={<BlockFallback />}>
              <ServicesGridBlock data={block.data} />
            </Suspense>
          );
        }

        if (block.block_type === "gallery") {
          return (
            <Suspense key={key} fallback={<BlockFallback />}>
              <GalleryBlock data={block.data} />
            </Suspense>
          );
        }

        return null;
      })}
    </>
  );
}

export function DynamicPage({ slug, defaultTitle, defaultSubtitle }) {
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchBlocks() {
      setLoading(true);

      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error: supaError } = await supabase
          .from("steco_page_blocks")
          .select("*")
          .eq("page_slug", slug)
          .order("order_index", { ascending: true });

        if (!isMounted) return;

        if (supaError) {
          console.error("[Steco] Eroare la încărcarea blocurilor:", supaError.message);
          setBlocks([]);
          return;
        }

        const mapped = (data || []).map((row) => ({
          id: row.id,
          page_slug: row.page_slug,
          block_type: row.block_type,
          order_index: row.order_index ?? 0,
          data: row.content_json || row.block_data || {}
        }));

        // eslint-disable-next-line no-console
        console.log(`[Steco] Blocuri încărcate pentru slug "${slug}":`, mapped);

        setBlocks(mapped);
      } catch (err) {
        console.error("[Steco] Eroare neașteptată la încărcarea blocurilor:", err);
        // Lăsăm blocurile goale și afișăm conținutul implicit
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
      {loading && (
        <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6 lg:px-8">
          <p className="text-xs text-slate-400">
            Se încarcă blocurile pentru pagina <code className="font-mono">{slug}</code>...
          </p>
        </div>
      )}

      {!loading && (!blocks || !blocks.length) ? (
        <section className="mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-3xl p-6 text-center">
            <p className="text-lg font-semibold text-red-300">
              Eroare: Nu s-au găsit date pentru slug-ul "{slug}" în Supabase.
            </p>
            <p className="mt-2 text-sm text-slate-400">
              Verifică în tabela <code className="font-mono">steco_page_blocks</code> că există rânduri cu{" "}
              <code className="font-mono">page_slug = "{slug}"</code>.
            </p>
          </div>
        </section>
      ) : (
        <BlockManager
          blocks={blocks}
          defaults={{ title: defaultTitle, subtitle: defaultSubtitle }}
          slug={slug}
        />
      )}
    </main>
  );
}

