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

function BlockFallback() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
      <div className="glass-panel rounded-2xl p-4 text-xs text-slate-300">Se încarcă secțiunea...</div>
    </section>
  );
}

function BlockManager({ blocks, defaults }) {
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
          return (
            <Suspense key={key} fallback={<BlockFallback />}>
              <TextPhotoBlock data={block.data} />
            </Suspense>
          );
        }

        if (block.block_type === "services_grid") {
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
          .select("id,page_slug,block_type,block_data,order_index")
          .eq("page_slug", slug)
          .order("order_index", { ascending: true });

        if (!isMounted) return;

        if (!supaError) {
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

      <BlockManager
        blocks={blocks}
        defaults={{ title: defaultTitle, subtitle: defaultSubtitle }}
      />
    </main>
  );
}

