// Textul din admin vine ca un singur șir; liniile goale despart paragrafele.
export function splitParagraphs(text) {
  return String(text || "")
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function Paragraphs({ text, className = "" }) {
  const paragraphs = splitParagraphs(text);
  if (!paragraphs.length) return null;

  return (
    <div className={className}>
      {paragraphs.map((paragraph, idx) => (
        <p key={idx} style={{ whiteSpace: "pre-line" }}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
