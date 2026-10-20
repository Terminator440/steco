import { splitParagraphs } from "./Paragraphs";

export function TextSectionBlock({ data }) {
  const [lede, ...rest] = splitParagraphs(data?.text);

  if (!lede) return null;

  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mx-auto max-w-[66ch]">
          <p className="font-display text-[1.625rem] leading-[1.45] text-ink sm:text-[1.875rem]" style={{ whiteSpace: "pre-line" }}>
            {lede}
          </p>
          {rest.length > 0 && (
            <div className="mt-10 space-y-5 text-[1.125rem] leading-[1.7] text-ink-soft">
              {rest.map((paragraph, idx) => (
                <p key={idx} style={{ whiteSpace: "pre-line" }}>
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
