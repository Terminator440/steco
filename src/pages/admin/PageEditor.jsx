import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { clearBlocksCache } from "../../lib/content";
import { compressImage } from "./compressImage";
import { PAGES, SECTION_TYPES, SectionEditor, newId } from "./sections";
import { Notice, buttonClass } from "./ui";

const BUCKET = "steco-images";
const MAX_BYTES = 10 * 1024 * 1024;

function snapshot(blocks) {
  return JSON.stringify(blocks.map((b) => [b.id, b.block_type, b.data]));
}

// Antetul rămâne primul, chiar dacă împarte numărul de ordine cu altă secțiune.
function sortBlocks(rows) {
  return [...rows].sort(
    (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0) || (a.block_type === "hero" ? -1 : b.block_type === "hero" ? 1 : 0)
  );
}

export function PageEditor() {
  const [slug, setSlug] = useState(PAGES[0].slug);
  const [blocks, setBlocks] = useState([]);
  const [saved, setSaved] = useState("[]");
  const [removed, setRemoved] = useState([]);
  const [open, setOpen] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [picking, setPicking] = useState(false);
  const listEndRef = useRef(null);

  const page = PAGES.find((p) => p.slug === slug);
  const dirty = useMemo(() => snapshot(blocks) !== saved || removed.length > 0, [blocks, saved, removed]);

  const load = useCallback(async (targetSlug) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("steco_page_blocks")
      .select("id, block_type, order_index, content_json")
      .eq("page_slug", targetSlug);

    if (error) {
      setNotice({ type: "error", text: `Pagina nu s-a încărcat: ${error.message}` });
      setBlocks([]);
      setSaved("[]");
    } else {
      const rows = sortBlocks(data || []).map((row) => ({ id: row.id, block_type: row.block_type, data: row.content_json || {} }));
      setBlocks(rows);
      setSaved(snapshot(rows));
    }
    setRemoved([]);
    setOpen(new Set());
    setPicking(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load(slug);
  }, [slug, load]);

  // Avertizare la închiderea tab-ului cu modificări nepublicate.
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const upload = useCallback(
    async (original) => {
      if (original.type && !original.type.startsWith("image/")) throw new Error("Fișierul ales nu este o poză.");
      const file = await compressImage(original);
      if (file.size > MAX_BYTES) throw new Error("Poza are peste 10 MB chiar și după micșorare. Alege una mai mică.");

      const safeName = file.name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-zA-Z0-9.]+/g, "-")
        .toLowerCase();
      const path = `steco-images/${slug}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw new Error(`Poza nu s-a încărcat (${error.message}).`);
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },
    [slug]
  );

  function choosePage(nextSlug) {
    if (nextSlug === slug) return;
    if (dirty && !window.confirm("Ai modificări nepublicate pe pagina asta. Dacă schimbi pagina, le pierzi. Continui?")) return;
    setNotice(null);
    setSlug(nextSlug);
  }

  function updateData(id, updater) {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, data: typeof updater === "function" ? updater(b.data) : updater } : b)));
  }

  function move(index, to) {
    setBlocks((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  function remove(block) {
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    if (saved.includes(`"${block.id}"`)) setRemoved((prev) => [...prev, block.id]);
    setNotice({ type: "info", text: `Ai scos secțiunea „${SECTION_TYPES[block.block_type]?.label}”. Dispare de pe site după ce publici.` });
  }

  function toggle(id) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function addSection(type) {
    const block = { id: newId(), block_type: type, data: SECTION_TYPES[type].empty() };
    setBlocks((prev) => [...prev, block]);
    setOpen((prev) => new Set(prev).add(block.id));
    setPicking(false);
    requestAnimationFrame(() => listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  }

  function discard() {
    load(slug);
    setNotice({ type: "info", text: "Am renunțat la modificări. Pagina arată ca pe site." });
  }

  async function publish() {
    setSaving(true);
    setNotice(null);
    try {
      if (removed.length) {
        const { error } = await supabase.from("steco_page_blocks").delete().in("id", removed);
        if (error) throw error;
      }
      if (blocks.length) {
        const payload = blocks.map((b, index) => ({
          id: b.id,
          page_slug: slug,
          block_type: b.block_type,
          order_index: index,
          content_json: b.data || {}
        }));
        const { error } = await supabase.from("steco_page_blocks").upsert(payload, { onConflict: "id" });
        if (error) throw error;
      }
      clearBlocksCache();
      setSaved(snapshot(blocks));
      setRemoved([]);
      setNotice({ type: "success", text: `Am publicat pagina „${page.label}”. Modificările se văd acum pe site.` });
    } catch (err) {
      setNotice({ type: "error", text: `Pagina nu s-a publicat: ${err.message || "eroare necunoscută"}. Modificările tale sunt încă aici, încearcă din nou.` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-[1200px] grid-cols-[minmax(0,1fr)] gap-8 px-4 pb-40 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav aria-label="Pagini" className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 hidden text-[0.8125rem] font-medium text-ink-soft lg:block">Pagini</p>
        <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {PAGES.map((p) => (
            <li key={p.slug} className="shrink-0">
              <button
                type="button"
                onClick={() => choosePage(p.slug)}
                aria-current={p.slug === slug ? "page" : undefined}
                className={[
                  "w-full rounded-full px-4 py-2 text-left text-[0.9375rem] transition-colors lg:rounded-lg",
                  p.slug === slug ? "bg-plum text-cream" : "bg-white text-ink hover:bg-blush/60 lg:bg-transparent"
                ].join(" ")}
              >
                {p.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-[2rem] leading-none">{page.label}</h1>
            <p className="mt-2 text-[0.9375rem] text-ink-soft">
              Secțiunile apar pe site în ordinea de mai jos. Deschide una ca s-o modifici.
            </p>
          </div>
          <a href={page.path} target="_blank" rel="noreferrer" className={buttonClass.secondary}>
            Vezi pagina pe site ↗
          </a>
        </div>

        {slug === "home" && (
          <div className="mb-5">
            <Notice>
              Sub antet, prima pagină se completează singură: textul și poza din „Despre noi”, lista din „Servicii” și
              primele trei galerii din „Portofoliu”. Modifică-le acolo. Secțiunile adăugate aici apar după ele.
            </Notice>
          </div>
        )}

        {notice && (
          <div className="mb-5">
            <Notice type={notice.type} onClose={() => setNotice(null)}>
              {notice.text}
            </Notice>
          </div>
        )}

        {loading ? (
          <p className="rounded-xl border border-line bg-white px-5 py-8 text-center text-ink-soft">Se încarcă pagina...</p>
        ) : (
          <ol className="grid gap-3">
            {blocks.map((block, index) => {
              const type = SECTION_TYPES[block.block_type] || { label: block.block_type, summary: () => "" };
              const isOpen = open.has(block.id);
              return (
                <li key={block.id} className="overflow-hidden rounded-2xl border border-line bg-white">
                  <div className="flex flex-wrap items-center gap-2 px-4 py-3 sm:flex-nowrap sm:px-5">
                    <button
                      type="button"
                      onClick={() => toggle(block.id)}
                      aria-expanded={isOpen}
                      className="flex min-w-0 flex-1 items-center gap-3 py-1 text-left"
                    >
                      <span
                        aria-hidden="true"
                        className={`inline-block text-ink-soft transition-transform ${isOpen ? "rotate-90" : ""}`}
                      >
                        ›
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[0.9375rem] font-semibold text-ink">{type.label}</span>
                        <span className="block truncate text-[0.875rem] text-ink-soft">{type.summary(block.data || {})}</span>
                      </span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button type="button" className={buttonClass.quiet} onClick={() => move(index, index - 1)} disabled={index === 0} aria-label="Mută secțiunea mai sus">
                        ↑
                      </button>
                      <button
                        type="button"
                        className={buttonClass.quiet}
                        onClick={() => move(index, index + 1)}
                        disabled={index === blocks.length - 1}
                        aria-label="Mută secțiunea mai jos"
                      >
                        ↓
                      </button>
                      <button type="button" className={buttonClass.danger} onClick={() => remove(block)}>
                        Șterge
                      </button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="border-t border-line bg-paper/40 px-4 py-5 sm:px-6 sm:py-6">
                      <SectionEditor block={block} upload={upload} onChange={(updater) => updateData(block.id, updater)} />
                    </div>
                  )}
                </li>
              );
            })}

            {!blocks.length && (
              <li className="rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center text-ink-soft">
                Pagina nu are încă secțiuni. Pe site apare doar titlul implicit. Adaugă prima secțiune mai jos.
              </li>
            )}
            <li ref={listEndRef} aria-hidden="true" />
          </ol>
        )}

        {!loading && (
          <div className="mt-4">
            {picking ? (
              <div className="rounded-2xl border border-line bg-white p-4 sm:p-5">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="font-semibold">Ce fel de secțiune adaugi?</p>
                  <button type="button" className={buttonClass.quiet} onClick={() => setPicking(false)}>
                    Renunță
                  </button>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(SECTION_TYPES).map(([value, type]) => (
                    <li key={value}>
                      <button
                        type="button"
                        onClick={() => addSection(value)}
                        className="h-full w-full rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-plum hover:bg-plum/5"
                      >
                        <span className="block font-semibold">{type.label}</span>
                        <span className="mt-0.5 block text-[0.875rem] text-ink-soft">{type.description}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <button type="button" className={`${buttonClass.secondary} w-full justify-center py-3`} onClick={() => setPicking(true)}>
                + Adaugă o secțiune
              </button>
            )}
          </div>
        )}
      </div>

      {dirty && !loading && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(42,20,48,0.08)] backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3">
            <p className="text-[0.9375rem]">
              <span className="font-semibold">Ai modificări nepublicate</span>
              <span className="text-ink-soft"> pe pagina {page.label}. Site-ul nu se schimbă până nu publici.</span>
            </p>
            <div className="flex gap-2">
              <button type="button" className={buttonClass.secondary} onClick={discard} disabled={saving}>
                Renunță la modificări
              </button>
              <button type="button" className={buttonClass.primary} onClick={publish} disabled={saving}>
                {saving ? "Se publică..." : "Publică pe site"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
