import { Link } from "react-router-dom";
import { withoutEmoji } from "../../lib/text";

export function ServicesGridBlock({ data, limit, moreLink }) {
  const all = Array.isArray(data?.items) ? data.items.filter((item) => item?.title || item?.description) : [];
  const items = limit ? all.slice(0, limit) : all;

  if (!items.length) return null;

  return (
    <section data-header="light" className="bg-paper px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-line pb-10">
          <h2 className="display display-lg reveal">{data.heading || "Ce organizăm"}</h2>
          {moreLink && all.length > items.length && (
            <Link to={moreLink} className="link-dots">
              Toate serviciile
            </Link>
          )}
        </div>

        <ul className="grid gap-x-14 gap-y-16 pt-14 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, idx) => (
            <li key={item.id || idx} className="reveal">
              <h3 className="display display-sm">{withoutEmoji(item.title)}</h3>
              {item.description && (
                <p className="mt-4 max-w-[42ch] text-ink-soft" style={{ whiteSpace: "pre-line" }}>
                  {item.description}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
