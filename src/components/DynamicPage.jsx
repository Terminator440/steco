import { lazy, Suspense, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Hero } from "./Hero";
import { ContactForm } from "./ContactForm";

const TextPhotoBlock = lazy(() =>
  import("./blocks/TextPhotoBlock").then((module) => ({ default: module.TextPhotoBlock }))
);
const ServicesGridBlock = lazy(() =>
  import("./blocks/ServicesGridBlock").then((module) => ({ default: module.ServicesGridBlock }))
);
const GalleryBlock = lazy(() =>
  import("./blocks/GalleryBlock").then((module) => ({ default: module.GalleryBlock }))
);
const TextSectionBlock = lazy(() =>
  import("./blocks/TextSectionBlock").then((module) => ({ default: module.TextSectionBlock }))
);
const ParticipantsGridBlock = lazy(() =>
  import("./blocks/ParticipantsGridBlock").then((module) => ({ default: module.ParticipantsGridBlock }))
);

const LAZY_BLOCKS = {
  text_photo: TextPhotoBlock,
  services_grid: ServicesGridBlock,
  gallery: GalleryBlock,
  text_section: TextSectionBlock,
  participants_grid: ParticipantsGridBlock
};

function HeroBlock({ data, defaults, slug }) {
  return (
    <Hero
      title={data?.title || defaults.title}
      subtitle={data?.subtitle || defaults.subtitle}
      imageUrl={data?.backgroundImageUrl}
      ctaLabel={data?.buttonLabel}
      ctaHref={data?.buttonHref}
      variant={slug === "home" ? "feature" : "page"}
    />
  );
}

function BlockFallback() {
  return <div className="min-h-[40vh]" aria-hidden="true" />;
}

function BlockManager({ blocks, defaults, slug }) {
  // Hero-ul e antetul paginii, așa că apare primul chiar dacă împarte order_index cu alt bloc.
  const hero = blocks.find((block) => block.block_type === "hero");
  const rest = blocks.filter((block) => block !== hero);

  return (
    <>
      <HeroBlock key={hero?.id || "hero-implicit"} data={hero?.data} defaults={defaults} slug={slug} />

      {rest.map((block) => {
        const key = block.id || `${block.block_type}-${block.order_index}`;

        if (block.block_type === "hero") {
          return <HeroBlock key={key} data={block.data} defaults={defaults} slug={slug} />;
        }

        const Block = LAZY_BLOCKS[block.block_type];
        if (!Block) return null;

        return (
          <Suspense key={key} fallback={<BlockFallback />}>
            <Block data={block.data} />
          </Suspense>
        );
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
          setBlocks([]);
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

        if (!data?.length) {
          console.warn(`[Steco] Nu există blocuri pentru pagina "${slug}" în steco_page_blocks.`);
        }

        setBlocks(
          (data || []).map((row) => ({
            id: row.id,
            page_slug: row.page_slug,
            block_type: row.block_type,
            order_index: row.order_index ?? 0,
            data: row.content_json || row.block_data || {}
          }))
        );
      } catch (err) {
        console.error("[Steco] Eroare neașteptată la încărcarea blocurilor:", err);
        // Vizitatorul vede pagina cu textele implicite, nu mesajul de eroare.
        if (isMounted) setBlocks([]);
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
    <main className="min-h-screen">
      {loading ? (
        <div className="min-h-[100svh]" aria-busy="true" aria-label="Se încarcă pagina" />
      ) : (
        <>
          <BlockManager blocks={blocks} defaults={{ title: defaultTitle, subtitle: defaultSubtitle }} slug={slug} />
          {slug === "contact" && <ContactForm />}
        </>
      )}
    </main>
  );
}
