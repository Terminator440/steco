import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SLUGS = [
  { slug: "home", label: "Home" },
  { slug: "servicii", label: "Servicii" },
  { slug: "portofoliu", label: "Portofoliu" },
  { slug: "contact", label: "Contact" }
];

const SECTION_TYPES = [
  { value: "hero", label: "Hero Section" },
  { value: "services_grid", label: "Grid Servicii" },
  { value: "gallery", label: "Galerie Foto" },
  { value: "text_block", label: "Text Block" }
];

function createEmptySection(type, pageSlug, orderIndex) {
  if (type === "hero") {
    return {
      page_slug: pageSlug,
      section_type: "hero",
      order_index: orderIndex,
      data: {
        title: "",
        subtitle: "",
        backgroundImageUrl: "",
        ctaLabel: "",
        ctaHref: ""
      }
    };
  }

  if (type === "services_grid") {
    return {
      page_slug: pageSlug,
      section_type: "services_grid",
      order_index: orderIndex,
      data: {
        heading: "",
        subheading: "",
        items: []
      }
    };
  }

  if (type === "gallery") {
    return {
      page_slug: pageSlug,
      section_type: "gallery",
      order_index: orderIndex,
      data: {
        heading: "",
        subheading: "",
        images: []
      }
    };
  }

  return {
    page_slug: pageSlug,
    section_type: "text_block",
    order_index: orderIndex,
    data: {
      heading: "",
      text: ""
    }
  };
}

export function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState("");

  const [selectedSlug, setSelectedSlug] = useState(PAGE_SLUGS[0].slug);
  const [sections, setSections] = useState([]);
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

    async function loadSections() {
      setLoadingPage(true);
      setPageMessage("");

      const { data, error } = await supabase
        .from("steco_page_content")
        .select("id,page_slug,section_type,order_index,data")
        .eq("page_slug", selectedSlug)
        .order("order_index", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setPageMessage("Nu s-au putut încărca secțiunile pentru această pagină.");
        setSections([]);
      } else {
        setSections(data || []);
      }

      setLoadingPage(false);
    }

    loadSections();

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

  function updateSection(index, newSection) {
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, ...newSection } : s)));
  }

  function handleAddSection(type) {
    setSections((prev) => {
      const orderIndex = prev.length ? prev[prev.length - 1].order_index + 1 : 0;
      return [...prev, createEmptySection(type, selectedSlug, orderIndex)];
    });
  }

  function moveSection(index, direction) {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next.map((s, i) => ({ ...s, order_index: i }));
    });
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

    const payload = sections.map((section, index) => ({
      id: section.id,
      page_slug: selectedSlug,
      section_type: section.section_type,
      order_index: index,
      data: section.data
    }));

    const { error } = await supabase
      .from("steco_page_content")
      .upsert(payload, { onConflict: "page_slug,order_index" });

    if (error) {
      setPageMessage("A apărut o eroare la salvarea paginii.");
    } else {
      setPageMessage("Pagina a fost publicată cu succes.");
    }

    setSavingPage(false);
  }

  async function handleImageUpload(pageSlug, sectionIndex, fieldPath) {
    return async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!supabase) {
        setUploadError("Supabase nu este configurat pentru upload.");
        return;
      }

      setUploadError("");
      const key = `${sectionIndex}-${fieldPath}`;
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

      setSections((prev) =>
        prev.map((section, idx) => {
          if (idx !== sectionIndex) return section;
          const newData = { ...section.data };
          if (fieldPath === "hero.background") {
            newData.backgroundImageUrl = publicUrl;
          } else if (fieldPath.startsWith("services_grid.icon.")) {
            const parts = fieldPath.split(".");
            const itemIndex = Number(parts[2]);
            const items = [...(newData.items || [])];
            items[itemIndex] = { ...(items[itemIndex] || {}), iconUrl: publicUrl };
            newData.items = items;
          } else if (fieldPath.startsWith("gallery.image.")) {
            const parts = fieldPath.split(".");
            const imgIndex = Number(parts[2]);
            const images = [...(newData.images || [])];
            images[imgIndex] = { ...(images[imgIndex] || {}), url: publicUrl };
            newData.images = images;
          }
          return { ...section, data: newData };
        })
      );

      setUploadingImagePath("");
    };
  }

  if (!isAuthed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <img
              src="/steco-logo.png"
              alt="Steco Events"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-rose-500/40 focus:border-rose-500 focus:ring-2"
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

            <p className="text-center text-[11px] text-slate-400">
              Introdu parola de administrator pentru a accesa panoul Steco.
            </p>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row">
        <aside className="glass-panel w-full rounded-3xl p-5 sm:p-6 lg:w-64">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-rose-400">Admin</p>
              <p className="text-sm font-medium text-slate-100">Administrator Steco</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-rose-500 hover:text-rose-400"
            >
              Logout
            </button>
          </div>

          <div className="mb-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
              Pagini disponibile
            </p>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-rose-500/40 focus:border-rose-500 focus:ring-2"
            >
              {PAGE_SLUGS.map((page) => (
                <option key={page.slug} value={page.slug}>
                  {page.label}
                </option>
              ))}
            </select>
          </div>

              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
            Adaugă secțiune nouă
          </p>
          <div className="space-y-2">
            {SECTION_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleAddSection(type.value)}
                className="w-full rounded-full border border-slate-700 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-200 hover:border-rose-500 hover:text-rose-400"
              >
                {type.label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-[11px] text-slate-500">
            Secțiunile sunt salvate în <code className="font-mono">steco_page_content</code> folosind{" "}
            <span className="font-semibold text-slate-300">upsert</span> și <code>order_index</code>.
          </p>
        </aside>

        <section className="glass-panel w-full flex-1 rounded-3xl p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
            <p className="text-[11px] uppercase tracking-[0.26em] text-rose-400">
                Page Builder
              </p>
              <p className="text-sm text-slate-300">
                Construiești vizual conținutul pentru pagina selectată.
              </p>
            </div>
            <div className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              slug: <span className="font-mono text-rose-400">{selectedSlug}</span>
            </div>
          </div>

          {loadingPage ? (
            <p className="text-sm text-slate-300">Se încarcă secțiunile paginii...</p>
          ) : (
            <form onSubmit={handlePublish} className="space-y-4">
              <div className="space-y-4">
                {sections.map((section, index) => {
                  const key = section.id || `${section.section_type}-${index}`;
                  const typeLabel =
                    SECTION_TYPES.find((t) => t.value === section.section_type)?.label ||
                    section.section_type;

                  const data = section.data || {};

                  return (
                    <div
                      key={key}
                      className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 sm:p-5"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[11px] uppercase tracking-[0.22em] text-yellow-400">
                            {typeLabel}
                          </p>
                          <p className="text-xs text-slate-400">
                            Secțiunea #{index + 1} · order_index {section.order_index}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => moveSection(index, -1)}
                            className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300 hover:border-yellow-500 hover:text-yellow-500"
                          >
                            Sus
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, 1)}
                            className="rounded-full border border-slate-700 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300 hover:border-yellow-500 hover:text-yellow-500"
                          >
                            Jos
                          </button>
                        </div>
                      </div>

                      {section.section_type === "hero" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Titlu
                            </label>
                            <input
                              type="text"
                              value={data.title || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, title: e.target.value }
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Subtitlu
                            </label>
                            <textarea
                              rows={3}
                              value={data.subtitle || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, subtitle: e.target.value }
                                })
                              }
                              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Imagine fundal (upload)
                            </label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload(selectedSlug, index, "hero.background")}
                              className="block w-full text-sm text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.16em] file:text-slate-200 hover:file:bg-slate-700"
                            />
                            {uploadingImagePath === `${index}-hero.background` && (
                              <p className="mt-1 text-[11px] text-slate-300">
                                Se încarcă imaginea...
                              </p>
                            )}
                            {data.backgroundImageUrl && (
                              <div className="mt-2 h-20 w-32 overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                                <img
                                  src={data.backgroundImageUrl}
                                  alt="Preview fundal hero"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-300">
                                Text buton CTA
                              </label>
                              <input
                                type="text"
                                value={data.ctaLabel || ""}
                                onChange={(e) =>
                                  updateSection(index, {
                                    data: { ...data, ctaLabel: e.target.value }
                                  })
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                              />
                            </div>
                            <div>
                              <label className="mb-1 block text-xs font-medium text-slate-300">
                                Link buton CTA
                              </label>
                              <input
                                type="text"
                                value={data.ctaHref || ""}
                                onChange={(e) =>
                                  updateSection(index, {
                                    data: { ...data, ctaHref: e.target.value }
                                  })
                                }
                                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {section.section_type === "services_grid" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Titlu secțiune
                            </label>
                            <input
                              type="text"
                              value={data.heading || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, heading: e.target.value }
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Subtitlu
                            </label>
                            <textarea
                              rows={3}
                              value={data.subheading || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, subheading: e.target.value }
                                })
                              }
                              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Servicii
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const items = [...(data.items || [])];
                                  items.push({
                                    id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
                                    title: "",
                                    description: "",
                                    iconUrl: ""
                                  });
                                  updateSection(index, { data: { ...data, items } });
                                }}
                                className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300 hover:border-yellow-500 hover:text-yellow-500"
                              >
                                Adaugă serviciu
                              </button>
                            </div>
                            {(data.items || []).map((item, itemIndex) => (
                              <div
                                key={item.id || itemIndex}
                                className="rounded-xl border border-slate-700 bg-slate-900/70 p-3"
                              >
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Serviciu #{itemIndex + 1}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const items = [...(data.items || [])];
                                      items.splice(itemIndex, 1);
                                      updateSection(index, { data: { ...data, items } });
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-red-400"
                                  >
                                    Șterge
                                  </button>
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-[11px] text-slate-300">
                                      Titlu
                                    </label>
                                    <input
                                      type="text"
                                      value={item.title || ""}
                                      onChange={(e) => {
                                        const items = [...(data.items || [])];
                                        items[itemIndex] = {
                                          ...(items[itemIndex] || {}),
                                          title: e.target.value
                                        };
                                        updateSection(index, { data: { ...data, items } });
                                      }}
                                      className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-[11px] text-slate-300">
                                      Pictogramă (upload)
                                    </label>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload(
                                        selectedSlug,
                                        index,
                                        `services_grid.icon.${itemIndex}`
                                      )}
                                      className="block w-full text-xs text-slate-100 file:mr-2 file:rounded-md file:border-0 file:bg-slate-800 file:px-2 file:py-1.5 file:font-semibold file:uppercase file:tracking-[0.14em] file:text-slate-200 hover:file:bg-slate-700"
                                    />
                                    {item.iconUrl && (
                                      <div className="mt-1 h-10 w-10 overflow-hidden rounded-full border border-slate-700 bg-slate-900">
                                        <img
                                          src={item.iconUrl}
                                          alt="Icon serviciu"
                                          className="h-full w-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <label className="mb-1 block text-[11px] text-slate-300">
                                    Descriere
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={item.description || ""}
                                    onChange={(e) => {
                                      const items = [...(data.items || [])];
                                      items[itemIndex] = {
                                        ...(items[itemIndex] || {}),
                                        description: e.target.value
                                      };
                                      updateSection(index, { data: { ...data, items } });
                                    }}
                                    className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.section_type === "gallery" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Titlu secțiune
                            </label>
                            <input
                              type="text"
                              value={data.heading || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, heading: e.target.value }
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Subtitlu
                            </label>
                            <textarea
                              rows={3}
                              value={data.subheading || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, subheading: e.target.value }
                                })
                              }
                              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                                Imagini
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  const images = [...(data.images || [])];
                                  images.push({ url: "", alt: "" });
                                  updateSection(index, { data: { ...data, images } });
                                }}
                                className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-300 hover:border-yellow-500 hover:text-yellow-500"
                              >
                                Adaugă imagine
                              </button>
                            </div>
                            {(data.images || []).map((img, imgIndex) => (
                              <div
                                key={img.url || imgIndex}
                                className="rounded-xl border border-slate-700 bg-slate-900/70 p-3"
                              >
                                <div className="mb-2 flex items-center justify-between">
                                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                                    Imagine #{imgIndex + 1}
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const images = [...(data.images || [])];
                                      images.splice(imgIndex, 1);
                                      updateSection(index, { data: { ...data, images } });
                                    }}
                                    className="text-[10px] text-slate-400 hover:text-red-400"
                                  >
                                    Șterge
                                  </button>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageUpload(
                                    selectedSlug,
                                    index,
                                    `gallery.image.${imgIndex}`
                                  )}
                                  className="block w-full text-xs text-slate-100 file:mr-2 file:rounded-md file:border-0 file:bg-slate-800 file:px-2 file:py-1.5 file:font-semibold file:uppercase file:tracking-[0.14em] file:text-slate-200 hover:file:bg-slate-700"
                                />
                                {img.url && (
                                  <div className="mt-2 h-24 w-full overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                                    <img
                                      src={img.url}
                                      alt={img.alt || "Preview imagine galerie"}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                )}
                                <div className="mt-2">
                                  <label className="mb-1 block text-[11px] text-slate-300">
                                    Text alternativ
                                  </label>
                                  <input
                                    type="text"
                                    value={img.alt || ""}
                                    onChange={(e) => {
                                      const images = [...(data.images || [])];
                                      images[imgIndex] = {
                                        ...(images[imgIndex] || {}),
                                        alt: e.target.value
                                      };
                                      updateSection(index, { data: { ...data, images } });
                                    }}
                                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.section_type === "text_block" && (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Titlu
                            </label>
                            <input
                              type="text"
                              value={data.heading || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, heading: e.target.value }
                                })
                              }
                              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium text-slate-300">
                              Text
                            </label>
                            <textarea
                              rows={5}
                              value={data.text || ""}
                              onChange={(e) =>
                                updateSection(index, {
                                  data: { ...data, text: e.target.value }
                                })
                              }
                              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-yellow-500/40 focus:border-yellow-500 focus:ring-2"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!sections.length && (
                  <p className="text-sm text-slate-300">
                    Nu există încă secțiuni pentru această pagină. Folosește butoanele din stânga pentru a adăuga prima
                    secțiune.
                  </p>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-red-300">{uploadError}</p>
              )}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  className="btn-primary px-8"
                  disabled={savingPage}
                >
                  {savingPage ? "Se publică..." : "Publică pagina"}
                </button>

                {pageMessage && (
                  <p className="text-xs text-slate-300">{pageMessage}</p>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

