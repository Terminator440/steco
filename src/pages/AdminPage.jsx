import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { withSupabaseImageParams } from "../lib/imageUtils";

const PAGE_SLUGS = [
  { slug: "home", label: "Home" },
  { slug: "servicii", label: "Servicii" },
  { slug: "portofoliu", label: "Portofoliu" },
  { slug: "contact", label: "Contact" }
];

const BLOCK_TYPES = [
  { value: "hero", label: "Hero" },
  { value: "text_photo", label: "Text & Foto" },
  { value: "services_grid", label: "Grilă Servicii" },
  { value: "gallery", label: "Galerie" }
];

function getUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function createEmptyBlock(type, pageSlug, orderIndex) {
  if (type === "hero") {
    return {
      page_slug: pageSlug,
      block_type: "hero",
      order_index: orderIndex,
      data: {
        title: "",
        subtitle: "",
        backgroundImageUrl: "",
        buttonLabel: "",
        buttonHref: ""
      }
    };
  }

  if (type === "text_photo") {
    return {
      page_slug: pageSlug,
      block_type: "text_photo",
      order_index: orderIndex,
      data: {
        title: "",
        text: "",
        imageUrl: "",
        imageAlt: "",
        imagePosition: "right"
      }
    };
  }

  if (type === "services_grid") {
    return {
      page_slug: pageSlug,
      block_type: "services_grid",
      order_index: orderIndex,
      data: {
        heading: "",
        items: []
      }
    };
  }

  return {
    page_slug: pageSlug,
    block_type: "gallery",
    order_index: orderIndex,
    data: {
      heading: "",
      images: []
    }
  };
}

function mapLegacySectionToBlock(row) {
  if (row.section_type === "hero") {
    return {
      block_type: "hero",
      order_index: row.order_index ?? 0,
      data: {
        title: row.content_json?.title || "",
        subtitle: row.content_json?.subtitle || "",
        backgroundImageUrl: row.content_json?.backgroundImageUrl || "",
        buttonLabel: row.content_json?.ctaLabel || "",
        buttonHref: row.content_json?.ctaHref || ""
      }
    };
  }

  if (row.section_type === "services_grid") {
    return {
      block_type: "services_grid",
      order_index: row.order_index ?? 0,
      data: {
        heading: row.content_json?.heading || "",
        items: row.content_json?.items || []
      }
    };
  }

  if (row.section_type === "gallery") {
    return {
      block_type: "gallery",
      order_index: row.order_index ?? 0,
      data: {
        heading: row.content_json?.heading || "",
        images: row.content_json?.images || []
      }
    };
  }

  if (row.section_type === "text_block") {
    return {
      block_type: "text_photo",
      order_index: row.order_index ?? 0,
      data: {
        title: row.content_json?.heading || "",
        text: row.content_json?.text || "",
        imageUrl: "",
        imageAlt: "",
        imagePosition: "right"
      }
    };
  }

  return null;
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 12h8l1-12" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

export function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [selectedSlug, setSelectedSlug] = useState(PAGE_SLUGS[0].slug);
  const [blocks, setBlocks] = useState([]);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [savingPage, setSavingPage] = useState(false);
  const [pageMessage, setPageMessage] = useState("");

  const [uploadingImagePath, setUploadingImagePath] = useState("");
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    const stored = window.localStorage.getItem("steco_session");
    if (stored === "true") {
      setIsAuthed(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed || !supabase) return;

    let isMounted = true;

    async function loadBlocks() {
      setLoadingPage(true);
      setPageMessage("");

      const { data, error } = await supabase
        .from("steco_page_blocks")
        .select("id,page_slug,block_type,block_data,order_index")
        .eq("page_slug", selectedSlug)
        .order("order_index", { ascending: true });

      if (!isMounted) return;

      if (error) {
        const legacy = await supabase
          .from("steco_page_content")
          .select("page_slug,section_type,content_json,order_index")
          .eq("page_slug", selectedSlug)
          .order("order_index", { ascending: true });

        if (legacy.error) {
          setPageMessage("Nu s-au putut încărca blocurile pentru această pagină.");
          setBlocks([]);
        } else {
          const mappedLegacy = (legacy.data || [])
            .map((row) => mapLegacySectionToBlock(row))
            .filter(Boolean)
            .map((row, index) => ({
              ...row,
              page_slug: selectedSlug,
              order_index: index
            }));
          setBlocks(mappedLegacy);
          setPageMessage(
            mappedLegacy.length
              ? "Am încărcat datele vechi. Publică pagina ca să le migrezi în steco_page_blocks."
              : "Pagina nu are încă blocuri."
          );
        }
      } else {
        const mapped = (data || []).map((row) => ({
          id: row.id,
          page_slug: row.page_slug,
          block_type: row.block_type,
          order_index: row.order_index ?? 0,
          data: row.block_data || {}
        }));
        setBlocks(mapped);
      }

      setLoadingPage(false);
    }

    loadBlocks();

    return () => {
      isMounted = false;
    };
  }, [selectedSlug, isAuthed]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    if (password !== "admin123") {
      setAuthError("Parolă incorectă.");
      return;
    }
    window.localStorage.setItem("steco_session", "true");
    setIsAuthed(true);
  }

  async function handleLogout() {
    window.localStorage.removeItem("steco_session");
    setIsAuthed(false);
  }

  function updateBlock(index, newBlock) {
    setBlocks((prev) => prev.map((block, i) => (i === index ? { ...block, ...newBlock } : block)));
  }

  function handleAddBlock(type) {
    setBlocks((prev) => {
      const orderIndex = prev.length ? prev[prev.length - 1].order_index + 1 : 0;
      return [...prev, createEmptyBlock(type, selectedSlug, orderIndex)];
    });
    setShowBlockMenu(false);
  }

  function moveBlock(index, direction) {
    setBlocks((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next.map((block, i) => ({ ...block, order_index: i }));
    });
  }

  function deleteBlock(index) {
    setBlocks((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((block, i) => ({
          ...block,
          order_index: i
        }))
    );
  }

  async function handlePublish(e) {
    e.preventDefault();
    setSavingPage(true);
    setPageMessage("");

    if (!supabase) {
      setPageMessage("Supabase nu este configurat.");
      setSavingPage(false);
      return;
    }

    const payload = blocks.map((block, index) => ({
      page_slug: selectedSlug,
      block_type: block.block_type,
      block_data: block.data || {},
      order_index: index
    }));

    const { error: deleteError } = await supabase
      .from("steco_page_blocks")
      .delete()
      .eq("page_slug", selectedSlug);

    if (deleteError) {
      setPageMessage("A apărut o eroare la curățarea blocurilor existente.");
      setSavingPage(false);
      return;
    }

    if (payload.length) {
      const { error: insertError } = await supabase
        .from("steco_page_blocks")
        .insert(payload);

      if (insertError) {
        setPageMessage("A apărut o eroare la salvarea blocurilor.");
        setSavingPage(false);
        return;
      }
    }

    setPageMessage("Pagina a fost publicată cu succes.");
    setSavingPage(false);
  }

  async function handleImageUpload(pageSlug, blockIndex, fieldPath) {
    return async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!supabase) {
        setUploadError("Supabase nu este configurat pentru upload.");
        return;
      }

      setUploadError("");
      const key = `${blockIndex}-${fieldPath}`;
      setUploadingImagePath(key);

      const filePath = `${pageSlug}/${Date.now()}-${file.name}`;

      const { error: uploadErr } = await supabase
        .storage
        .from("steco-images")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadErr) {
        setUploadError("Eroare la upload-ul imaginii. Încearcă din nou.");
        setUploadingImagePath("");
        return;
      }

      const { data: publicData } = supabase
        .storage
        .from("steco-images")
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl || "";

      setBlocks((prev) =>
        prev.map((block, idx) => {
          if (idx !== blockIndex) return block;
          const newData = { ...block.data };

          if (fieldPath === "hero.background") {
            newData.backgroundImageUrl = publicUrl;
          } else if (fieldPath === "text_photo.image") {
            newData.imageUrl = publicUrl;
          } else if (fieldPath.startsWith("services_grid.icon.")) {
            const itemIndex = Number(fieldPath.split(".")[2]);
            const items = [...(newData.items || [])];
            items[itemIndex] = { ...(items[itemIndex] || {}), iconUrl: publicUrl };
            newData.items = items;
          } else if (fieldPath.startsWith("gallery.image.")) {
            const imageIndex = Number(fieldPath.split(".")[2]);
            const images = [...(newData.images || [])];
            images[imageIndex] = { ...(images[imageIndex] || {}), url: publicUrl };
            newData.images = images;
          }

          return { ...block, data: newData };
        })
      );

      setUploadingImagePath("");
    };
  }

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <img
              src="/steco-logo.png"
              alt="Steco Events"
              width="320"
              height="128"
              loading="eager"
              decoding="async"
              className="h-12 w-auto"
            />
            <h1 className="text-center font-display text-2xl text-slate-50">Admin Steco</h1>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="password">
                Parolă administrator
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-rose-500/30 focus:border-rose-500 focus:ring-2"
              />
            </div>

            {authError && (
              <p className="rounded-md border border-red-500/70 bg-red-950/50 px-3 py-2 text-xs text-red-100">
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary flex w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              Intră în cont
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3">
        <div className="flex items-center gap-3">
          <img
            src="/steco-logo.png"
            alt="Steco Events"
            width="320"
            height="128"
            loading="lazy"
            decoding="async"
            className="h-10 w-auto"
          />
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-rose-400">Steco Block Editor</p>
            <p className="text-sm text-slate-200">Construiește pagina din blocuri</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300 hover:border-rose-500 hover:text-rose-400"
        >
          Logout
        </button>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-2xl border border-slate-800 bg-slate-900/80 p-5 lg:w-72">
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
              Pagina editată
            </p>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-rose-500/30 focus:border-rose-500 focus:ring-2"
            >
              {PAGE_SLUGS.map((page) => (
                <option key={page.slug} value={page.slug}>
                  {page.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowBlockMenu((prev) => !prev)}
              className="w-full rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 hover:bg-slate-100"
            >
              Adaugă Bloc
            </button>

            {showBlockMenu && (
              <div className="mt-2 space-y-2 rounded-xl border border-slate-700 bg-slate-950 p-2">
                {BLOCK_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleAddBlock(type.value)}
                    className="w-full rounded-lg border border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-200 hover:border-rose-500 hover:text-rose-400"
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Publicare în <code className="font-mono">steco_page_blocks</code> după{" "}
            <code className="font-mono">page_slug</code>.
          </p>
        </aside>

        <section className="w-full flex-1 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-rose-400">Lista de blocuri</p>
              <p className="text-sm text-slate-300">Editare live, ordonare și publicare unificată</p>
            </div>
            <div className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              slug: <span className="font-mono text-rose-400">{selectedSlug}</span>
            </div>
          </div>

          {loadingPage ? (
            <p className="text-sm text-slate-300">Se încarcă blocurile paginii...</p>
          ) : (
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="space-y-4">
                {blocks.map((block, index) => {
                  const key = block.id || `${block.block_type}-${index}`;
                  const typeLabel =
                    BLOCK_TYPES.find((type) => type.value === block.block_type)?.label || block.block_type;
                  const data = block.data || {};

                  return (
                    <div key={key} className="rounded-2xl bg-white p-4 text-slate-900 shadow-xl sm:p-5">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.2em] text-rose-600">{typeLabel}</p>
                          <p className="text-xs text-slate-500">Bloc #{index + 1}</p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveBlock(index, -1)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100"
                          >
                            Sus
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(index, 1)}
                            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100"
                          >
                            Jos
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteBlock(index)}
                            className="inline-flex items-center justify-center rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                            aria-label={`Șterge blocul ${index + 1}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>

                      {block.block_type === "hero" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Titlu</label>
                            <input
                              type="text"
                              value={data.title || ""}
                              onChange={(e) => updateBlock(index, { data: { ...data, title: e.target.value } })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Subtitlu</label>
                            <textarea
                              rows={3}
                              value={data.subtitle || ""}
                              onChange={(e) => updateBlock(index, { data: { ...data, subtitle: e.target.value } })}
                              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Imagine fundal</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload(selectedSlug, index, "hero.background")}
                              className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-100 file:px-3 file:py-1.5 file:font-semibold file:text-slate-800 hover:file:bg-slate-200"
                            />
                            {uploadingImagePath === `${index}-hero.background` && (
                              <p className="mt-1 text-[11px] text-slate-500">Se încarcă imaginea...</p>
                            )}
                            {data.backgroundImageUrl && (
                              <div className="mt-2 aspect-[3/2] w-36 overflow-hidden rounded-md border border-slate-200">
                                <img
                                  src={withSupabaseImageParams(data.backgroundImageUrl, { width: 360, quality: 80 })}
                                  alt="Preview fundal hero"
                                  width="360"
                                  height="240"
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-600">Text buton</label>
                              <input
                                type="text"
                                value={data.buttonLabel || ""}
                                onChange={(e) => updateBlock(index, { data: { ...data, buttonLabel: e.target.value } })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-600">Link buton</label>
                              <input
                                type="text"
                                value={data.buttonHref || ""}
                                onChange={(e) => updateBlock(index, { data: { ...data, buttonHref: e.target.value } })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {block.block_type === "text_photo" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Titlu</label>
                            <input
                              type="text"
                              value={data.title || ""}
                              onChange={(e) => updateBlock(index, { data: { ...data, title: e.target.value } })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Text</label>
                            <textarea
                              rows={5}
                              value={data.text || ""}
                              onChange={(e) => updateBlock(index, { data: { ...data, text: e.target.value } })}
                              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                            />
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-600">Poziție imagine</label>
                              <select
                                value={data.imagePosition || "right"}
                                onChange={(e) =>
                                  updateBlock(index, { data: { ...data, imagePosition: e.target.value } })
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                              >
                                <option value="right">Text stânga · Poză dreapta</option>
                                <option value="left">Poză stânga · Text dreapta</option>
                              </select>
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-600">Alt imagine</label>
                              <input
                                type="text"
                                value={data.imageAlt || ""}
                                onChange={(e) => updateBlock(index, { data: { ...data, imageAlt: e.target.value } })}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Imagine</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload(selectedSlug, index, "text_photo.image")}
                              className="block w-full text-xs text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-slate-100 file:px-3 file:py-1.5 file:font-semibold file:text-slate-800 hover:file:bg-slate-200"
                            />
                            {uploadingImagePath === `${index}-text_photo.image` && (
                              <p className="mt-1 text-[11px] text-slate-500">Se încarcă imaginea...</p>
                            )}
                            {data.imageUrl && (
                              <div className="mt-2 aspect-[3/2] w-36 overflow-hidden rounded-md border border-slate-200">
                                <img
                                  src={withSupabaseImageParams(data.imageUrl, { width: 360, quality: 80 })}
                                  alt={data.imageAlt || "Preview text și foto"}
                                  width="360"
                                  height="240"
                                  loading="lazy"
                                  decoding="async"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {block.block_type === "services_grid" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Titlu grilă</label>
                            <input
                              type="text"
                              value={data.heading || ""}
                              onChange={(e) => updateBlock(index, { data: { ...data, heading: e.target.value } })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Servicii
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const items = [...(data.items || [])];
                                  items.push({
                                    id: getUID(),
                                    title: "",
                                    description: "",
                                    iconUrl: ""
                                  });
                                  updateBlock(index, { data: { ...data, items } });
                                }}
                                className="rounded-full border border-slate-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-100"
                              >
                                Adaugă element
                              </button>
                            </div>

                            {(data.items || []).map((item, itemIndex) => (
                              <div key={item.id || itemIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-xs font-semibold text-slate-600">Element #{itemIndex + 1}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const items = [...(data.items || [])];
                                      items.splice(itemIndex, 1);
                                      updateBlock(index, { data: { ...data, items } });
                                    }}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Șterge
                                  </button>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-[11px] text-slate-600">Titlu</label>
                                    <input
                                      type="text"
                                      value={item.title || ""}
                                      onChange={(e) => {
                                        const items = [...(data.items || [])];
                                        items[itemIndex] = {
                                          ...(items[itemIndex] || {}),
                                          title: e.target.value
                                        };
                                        updateBlock(index, { data: { ...data, items } });
                                      }}
                                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none ring-rose-300 focus:ring-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[11px] text-slate-600">Iconiță</label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload(selectedSlug, index, `services_grid.icon.${itemIndex}`)}
                                      className="block w-full text-xs text-slate-700 file:mr-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-slate-700"
                                    />
                                    {item.iconUrl && (
                                      <div className="mt-1 aspect-square w-10 overflow-hidden rounded-full border border-slate-200">
                                        <img
                                          src={withSupabaseImageParams(item.iconUrl, { width: 96, quality: 80 })}
                                          alt={item.title || "Icon"}
                                          width="96"
                                          height="96"
                                          loading="lazy"
                                          decoding="async"
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-2">
                                  <label className="mb-1 block text-[11px] text-slate-600">Descriere</label>
                                  <textarea
                                    rows={3}
                                    value={item.description || ""}
                                    onChange={(e) => {
                                      const items = [...(data.items || [])];
                                      items[itemIndex] = {
                                        ...(items[itemIndex] || {}),
                                        description: e.target.value
                                      };
                                      updateBlock(index, { data: { ...data, items } });
                                    }}
                                    className="w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none ring-rose-300 focus:ring-2"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {block.block_type === "gallery" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-600">Titlu galerie</label>
                            <input
                              type="text"
                              value={data.heading || ""}
                              onChange={(e) => updateBlock(index, { data: { ...data, heading: e.target.value } })}
                              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-rose-300 focus:ring-2"
                            />
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Imagini
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const images = [...(data.images || [])];
                                  images.push({ id: getUID(), url: "", alt: "" });
                                  updateBlock(index, { data: { ...data, images } });
                                }}
                                className="rounded-full border border-slate-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-700 hover:bg-slate-100"
                              >
                                Adaugă imagine
                              </button>
                            </div>

                            {(data.images || []).map((img, imgIndex) => (
                              <div key={img.id || img.url || imgIndex} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-xs font-semibold text-slate-600">Imagine #{imgIndex + 1}</p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const images = [...(data.images || [])];
                                      images.splice(imgIndex, 1);
                                      updateBlock(index, { data: { ...data, images } });
                                    }}
                                    className="text-xs text-red-600 hover:text-red-700"
                                  >
                                    Șterge
                                  </button>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload(selectedSlug, index, `gallery.image.${imgIndex}`)}
                                  className="block w-full text-xs text-slate-700 file:mr-2 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-2 file:py-1 file:text-slate-700"
                                />
                                {img.url && (
                                  <div className="mt-2 aspect-[3/2] w-full overflow-hidden rounded-md border border-slate-200">
                                    <img
                                      src={withSupabaseImageParams(img.url, { width: 640, quality: 80 })}
                                      alt={img.alt || "Preview galerie"}
                                      width="960"
                                      height="640"
                                      loading="lazy"
                                      decoding="async"
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="mt-2">
                                  <label className="mb-1 block text-[11px] text-slate-600">Text alternativ</label>
                                  <input
                                    type="text"
                                    value={img.alt || ""}
                                    onChange={(e) => {
                                      const images = [...(data.images || [])];
                                      images[imgIndex] = {
                                        ...(images[imgIndex] || {}),
                                        alt: e.target.value
                                      };
                                      updateBlock(index, { data: { ...data, images } });
                                    }}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs outline-none ring-rose-300 focus:ring-2"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!blocks.length && (
                  <p className="text-sm text-slate-300">
                    Nu există încă blocuri pentru această pagină. Folosește butonul{" "}
                    <span className="font-semibold text-white">Adaugă Bloc</span>.
                  </p>
                )}
              </div>

              {uploadError && <p className="text-xs text-red-300">{uploadError}</p>}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button type="submit" className="btn-primary px-8" disabled={savingPage}>
                  {savingPage ? "Se publică..." : "Publică Pagina"}
                </button>

                {pageMessage && <p className="text-xs text-slate-300">{pageMessage}</p>}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

