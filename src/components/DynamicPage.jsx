import { useEffect } from "react";
import { Link } from "react-router-dom";
import { blocksFor, imagesFrom, spreadImages, useAllBlocks } from "../lib/content";
import { ContactForm } from "./ContactForm";
import { Hero, PageHeader } from "./Hero";
import { Manifest } from "./home/Manifest";
import { GalleryBlock } from "./blocks/GalleryBlock";
import { ParticipantsGridBlock } from "./blocks/ParticipantsGridBlock";
import { ServicesGridBlock } from "./blocks/ServicesGridBlock";
import { TextPhotoBlock } from "./blocks/TextPhotoBlock";
import { TextSectionBlock } from "./blocks/TextSectionBlock";

const BLOCKS = {
  text_photo: TextPhotoBlock,
  services_grid: ServicesGridBlock,
  gallery: GalleryBlock,
  text_section: TextSectionBlock,
  participants_grid: ParticipantsGridBlock
};

// O galerie urmată de un text devine o singură secțiune: pozele în bandă, textul alături.
function pairGalleries(blocks) {
  const result = [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const next = blocks[i + 1];
    if (block.block_type === "gallery" && next?.block_type === "text_section") {
      result.push({ block, description: next.data?.text || "" });
      i += 1;
    } else {
      result.push({ block });
    }
  }
  return result;
}

function uniqueByUrl(images) {
  const seen = new Set();
  return images.filter((img) => !seen.has(img.url) && seen.add(img.url));
}

function RenderBlocks({ blocks }) {
  return pairGalleries(blocks).map(({ block, description }) => {
    const Block = BLOCKS[block.block_type];
    if (!Block) return null;
    return <Block key={block.id || `${block.block_type}-${block.order_index}`} data={block.data} description={description} />;
  });
}

function HomePage({ all, blocks, defaults }) {
  const hero = blocks.find((block) => block.block_type === "hero");
  const rest = blocks.filter((block) => block !== hero);
  const mission = blocksFor(all, "misiunea-noastra").find((block) => block.block_type === "text_photo");
  const services = blocksFor(all, "servicii").find((block) => block.block_type === "services_grid");
  const portfolio = pairGalleries(blocksFor(all, "portofoliu")).filter(({ block }) => block.block_type === "gallery");

  const collage = uniqueByUrl([
    ...(hero?.data?.backgroundImageUrl ? [{ url: hero.data.backgroundImageUrl }] : []),
    ...spreadImages(all, 8)
  ]).slice(0, 6);

  return (
    <>
      <Hero
        title={hero?.data?.title || defaults.title}
        subtitle={hero?.data?.subtitle}
        ctaLabel={hero?.data?.buttonLabel}
        ctaHref={hero?.data?.buttonHref}
        images={collage}
      />
      <Manifest text={mission?.data?.text} imageUrl={mission?.data?.imageUrl} imageAlt={mission?.data?.imageAlt} />
      {services && <ServicesGridBlock data={services.data} compact heading="Ce organizăm" moreLink="/servicii" />}
      {portfolio.slice(0, 3).map(({ block, description }) => (
        <GalleryBlock key={block.id} data={block.data} description={description} />
      ))}
      {portfolio.length > 3 && (
        <div data-header="light" className="bg-paper pb-24 text-center">
          <Link to="/portofoliu" className="link-dots">
            Vezi tot portofoliul
          </Link>
        </div>
      )}
      <RenderBlocks blocks={rest} />
    </>
  );
}

const PAGE_TITLES = {
  home: "Steco Events — organizare de evenimente",
  servicii: "Servicii — Steco Events",
  portofoliu: "Portofoliu — Steco Events",
  "misiunea-noastra": "Despre noi — Steco Events",
  participanti: "Participanți — Steco Events",
  contact: "Contact — Steco Events"
};

export function DynamicPage({ slug, defaultTitle, defaultSubtitle }) {
  const { loading, blocks: all } = useAllBlocks();

  useEffect(() => {
    document.title = PAGE_TITLES[slug] || PAGE_TITLES.home;
  }, [slug]);
  const defaults = { title: defaultTitle, subtitle: defaultSubtitle };

  if (loading) {
    return <main className="min-h-[100svh] bg-plum" aria-busy="true" aria-label="Se încarcă pagina" />;
  }

  const blocks = blocksFor(all, slug);

  if (slug === "home") {
    return (
      <main>
        <HomePage all={all} blocks={blocks} defaults={defaults} />
      </main>
    );
  }

  const hero = blocks.find((block) => block.block_type === "hero");
  const title = hero?.data?.title || defaults.title;
  const same = (a, b) => Boolean(a && b) && a.trim().toLowerCase() === b.trim().toLowerCase();
  // Un bloc care repetă titlul antetului își pierde titlul, ca să nu apară de două ori la rând.
  const rest = blocks
    .filter((block) => block !== hero)
    .map((block) => (same(block.data?.title, title) ? { ...block, data: { ...block.data, title: "" } } : block));
  // Dacă pagina are antet în admin, subtitlul lui se folosește exact (gol înseamnă fără subtitlu).
  const subtitle = hero ? hero.data?.subtitle || "" : defaults.subtitle;
  // Nu repetăm în antet un text care apare oricum imediat dedesubt.
  const repeatsBelow = rest.some((block) => block.data?.text && block.data.text.trim() === subtitle?.trim());
  const images = uniqueByUrl([...imagesFrom(blocks), ...spreadImages(all, 10).slice(5)]).slice(0, 4);

  return (
    <main>
      <PageHeader
        title={title}
        subtitle={repeatsBelow ? "" : subtitle}
        ctaLabel={hero?.data?.buttonLabel}
        ctaHref={hero?.data?.buttonHref}
        images={images}
      />
      <RenderBlocks blocks={rest} />
      {slug === "contact" && <ContactForm />}
    </main>
  );
}
