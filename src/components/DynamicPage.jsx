import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Hero } from "./Hero";

export function DynamicPage({ slug, defaultTitle, defaultSubtitle, sectionTitle }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchPage() {
      setLoading(true);
      setError("");

      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data, error: supaError } = await supabase
          .from("steco_pages")
          .select("slug,title,content,image_url")
          .eq("slug", slug)
          .maybeSingle();

        if (!isMounted) return;

        if (supaError) {
          setError("A apărut o eroare la încărcarea conținutului.");
        } else {
          setPage(data);
        }
      } catch (e) {
        if (isMounted) {
          setError("Nu s-a putut încărca conținutul.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchPage();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const title = page?.title || defaultTitle;
  const imageUrl = page?.image_url || undefined;

  return (
    <main className="min-h-screen bg-slate-950">
      <Hero title={title} subtitle={defaultSubtitle} imageUrl={imageUrl} />

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="glass-panel rounded-3xl p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold tracking-[0.26em] text-steco-gold/90 uppercase">
              {sectionTitle}
            </h2>

            {loading && (
              <span className="text-xs text-slate-400">
                Se încarcă conținutul pentru slug: <code className="font-mono">{slug}</code>
              </span>
            )}
          </div>

          {error && (
            <p className="mb-4 rounded-lg border border-red-500/60 bg-red-950/40 px-3 py-2 text-xs text-red-100">
              {error}
            </p>
          )}

          <article className="prose prose-invert max-w-none prose-headings:font-display prose-p:text-sm prose-p:text-slate-200 sm:prose-p:text-base">
            {page?.content ? (
              <p style={{ whiteSpace: "pre-line" }}>{page.content}</p>
            ) : (
              <p className="text-sm text-slate-300 sm:text-base">
                Nu există încă un text personalizat pentru această secțiune. Intră în{" "}
                <span className="font-semibold text-steco-gold">Admin</span> pentru a adăuga conținut
                în tabela <code className="font-mono">steco_pages</code> cu slug-ul{" "}
                <code className="font-mono">{slug}</code>.
              </p>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}

