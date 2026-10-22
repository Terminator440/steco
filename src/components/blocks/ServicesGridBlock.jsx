import { Link } from "react-router-dom";
import { blocksFor, useAllBlocks } from "../../lib/content";
import { anchorFor, eventTypeOf } from "../../lib/eventTypes";
import { withoutEmoji } from "../../lib/text";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

// compact: doar numele serviciilor (pe prima pagină), fiecare duce la descrierea lui de pe pagina Servicii.
// Pe pagina Servicii, fiecare serviciu duce mai departe la pozele lui și la formular, cu tipul deja ales.
export function ServicesGridBlock({ data, limit, moreLink, compact = false, heading }) {
  const { blocks } = useAllBlocks();
  const all = Array.isArray(data?.items) ? data.items.filter((item) => item?.title || item?.description) : [];
  const items = limit ? all.slice(0, limit) : all;

  if (!items.length) return null;

  const galleries = new Set(
    blocksFor(blocks, "portofoliu")
      .filter((block) => block.block_type === "gallery" && block.data?.images?.length)
      .map((block) => anchorFor(block.data.heading))
  );

  return (
    <section data-header="light" className="bg-paper px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-10">
          <h2 className="display display-lg reveal">{heading || data.heading || "Ce organizăm"}</h2>
          {moreLink && (compact || all.length > items.length) && (
            <Link to={moreLink} className="link-dots">
              Toate serviciile
            </Link>
          )}
        </div>

        {compact ? (
          <ul className="grid gap-x-14 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => {
              const title = withoutEmoji(item.title);
              return (
                <li key={item.id || idx} className="reveal border-b border-line">
                  <Link
                    to={`${moreLink || "/servicii"}#${anchorFor(title)}`}
                    className="group flex items-center justify-between gap-4 py-6 transition-colors hover:text-magenta sm:py-8"
                  >
                    <h3 className="display display-sm">{title}</h3>
                    <span className="text-magenta transition-transform duration-300 group-hover:translate-x-1">
                      <Arrow />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="grid gap-x-14 gap-y-16 pt-14 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => {
              const title = withoutEmoji(item.title);
              const anchor = anchorFor(title);
              const type = eventTypeOf(title);
              return (
                <li key={item.id || idx} id={anchor || undefined} className="reveal scroll-mt-28">
                  <h3 className="display display-sm">{title}</h3>
                  {item.description && (
                    <p className="mt-4 max-w-[42ch] text-ink-soft" style={{ whiteSpace: "pre-line" }}>
                      {item.description}
                    </p>
                  )}
                  <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-3">
                    <Link to={type ? `/contact?tip=${type}#formular` : "/contact#formular"} className="link-dots">
                      Cere o ofertă
                    </Link>
                    {galleries.has(anchor) && (
                      <Link
                        to={`/portofoliu#${anchor}`}
                        className="border-b border-ink/30 pb-0.5 text-[0.9375rem] font-medium transition-colors hover:border-magenta hover:text-magenta"
                      >
                        Vezi fotografii
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
