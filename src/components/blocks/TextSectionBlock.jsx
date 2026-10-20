import { splitParagraphs } from "./Paragraphs";

export function TextSectionBlock({ data }) {
  const [lede, ...rest] = splitParagraphs(data?.text);

  if (!lede) return null;

  return (
    <section data-header="light" className="bg-paper px-4 py-24 sm:px-8 sm:py-32">
      <div className="mx-auto max-w-[60ch] text-center">
        <p
          className="reveal font-display text-[clamp(1.6rem,2.8vw,2.5rem)] leading-[1.3] text-ink [text-wrap:balance]"
          style={{ whiteSpace: "pre-line" }}
        >
          {lede}
        </p>
        {rest.length > 0 && (
          <div className="mt-10 space-y-5 text-left text-[1.125rem] leading-[1.7] text-ink-soft">
            {rest.map((paragraph, idx) => (
              <p key={idx} className="reveal" style={{ whiteSpace: "pre-line" }}>
                {paragraph}
              </p>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
