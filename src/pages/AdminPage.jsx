import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const PAGE_SLUGS = [
  { slug: "home", label: "Home" },
  { slug: "servicii", label: "Servicii" },
  { slug: "portofoliu", label: "Portofoliu" },
  { slug: "contact", label: "Contact" }
];

export function AdminPage() {
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [authError, setAuthError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [selectedSlug, setSelectedSlug] = useState(PAGE_SLUGS[0].slug);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [loadingPage, setLoadingPage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  // Autentificare simplificată: doar parolă locală "admin123"
  useEffect(() => {
    const stored = window.localStorage.getItem("steco_admin_authenticated");
    if (stored === "true") {
      setUser({ role: "local-admin" });
    }
  }, []);

  useEffect(() => {
    if (!user || !supabase) return;

    let isMounted = true;

    async function loadPage() {
      setLoadingPage(true);
      setSaveStatus("");

      const { data, error } = await supabase
        .from("steco_pages")
        .select("slug,title,content,image_url")
        .eq("slug", selectedSlug)
        .maybeSingle();

      if (!isMounted) return;

      if (error || !data) {
        setTitle("");
        setContent("");
        setImageUrl("");
        setPreviewUrl("");
      } else {
        setTitle(data.title || "");
        setContent(data.content || "");
        setImageUrl(data.image_url || "");
        setPreviewUrl(data.image_url || "");
      }

      setLoadingPage(false);
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [selectedSlug, user]);

  async function handleLogin(e) {
    e.preventDefault();
    setAuthError("");
    setLoadingAuth(true);

    if (password !== "admin123") {
      setAuthError("Parolă greșită.");
      setLoadingAuth(false);
      return;
    }

    setUser({ role: "local-admin" });
    window.localStorage.setItem("steco_admin_authenticated", "true");
    setLoadingAuth(false);
  }

  async function handleLogout() {
    window.localStorage.removeItem("steco_admin_authenticated");
    setUser(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveStatus("saving");

    if (!supabase) {
      setSaveStatus("error");
      return;
    }

    const { error } = await supabase.from("steco_pages").upsert(
      {
        slug: selectedSlug,
        title: title || null,
        content: content || null,
        image_url: imageUrl || null
      },
      { onConflict: "slug" }
    );

    if (error) {
      setSaveStatus("error");
    } else {
      setSaveStatus("success");
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-4">
        <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8">
          <h1 className="mb-6 text-center font-display text-2xl text-slate-50">Admin Steco</h1>

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
                className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-steco-gold/40 focus:border-steco-gold focus:ring-2"
              />
            </div>

            {authError && (
              <p className="rounded-md border border-red-500/70 bg-red-950/50 px-3 py-2 text-xs text-red-100">
                {authError}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingAuth}
              className="btn-primary flex w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingAuth ? "Se conectează..." : "Intră în cont"}
            </button>

            <p className="text-center text-[11px] text-slate-400">
              Introdu parola de administrator configurată pentru acest site.
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
              <p className="text-xs uppercase tracking-[0.26em] text-steco-gold/90">Admin</p>
              <p className="text-sm font-medium text-slate-100">
                {user.email || "Utilizator autentificat"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-700 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300 hover:border-steco-gold hover:text-steco-gold"
            >
              Logout
            </button>
          </div>

          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">
            Pagini disponibile
          </p>
          <ul className="space-y-1.5 text-sm">
            {PAGE_SLUGS.map((page) => (
              <li key={page.slug}>
                <button
                  type="button"
                  onClick={() => setSelectedSlug(page.slug)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left ${
                    selectedSlug === page.slug
                      ? "bg-slate-800 text-steco-gold"
                      : "text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <span>{page.label}</span>
                  <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                    {page.slug}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[11px] text-slate-500">
            Modificările se salvează în tabela <code className="font-mono">steco_pages</code> prin{" "}
            <span className="font-semibold text-slate-300">upsert</span>.
          </p>
        </aside>

        <section className="glass-panel w-full flex-1 rounded-3xl p-5 sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.26em] text-steco-gold/90">
                Content Manager
              </p>
              <p className="text-sm text-slate-300">
                Editezi titlul, textul și imaginea pentru pagina curentă.
              </p>
            </div>
            <div className="rounded-full border border-slate-700 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              slug: <span className="font-mono text-steco-gold">{selectedSlug}</span>
            </div>
          </div>

          {loadingPage ? (
            <p className="text-sm text-slate-300">Se încarcă datele paginii...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-slate-300" htmlFor="title">
                    Titlu pagină
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Evenimentul tău, regizat la perfecțiune."
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-steco-gold/40 focus:border-steco-gold focus:ring-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                    htmlFor="content"
                  >
                    Text (conținut principal)
                  </label>
                  <textarea
                    id="content"
                    rows={8}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Scrie aici conținutul pentru această pagină. Poți folosi mai multe paragrafe."
                    className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none ring-0 ring-steco-gold/40 focus:border-steco-gold focus:ring-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    className="mb-1.5 block text-xs font-medium text-slate-300"
                    htmlFor="imageFile"
                  >
                    Imagine (upload în Storage)
                  </label>
                  <input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) {
                        return;
                      }

                      if (!supabase) {
                        setUploadError("Supabase nu este configurat pentru upload.");
                        return;
                      }

                      setUploadError("");
                      setUploadingImage(true);

                      const filePath = `${selectedSlug}/${Date.now()}-${file.name}`;

                      const { error: uploadErr } = await supabase
                        .storage
                        .from("steco-images")
                        .upload(filePath, file, {
                          cacheControl: "3600",
                          upsert: false
                        });

                      if (uploadErr) {
                        setUploadError("Eroare la upload-ul imaginii. Încearcă din nou.");
                        setUploadingImage(false);
                        return;
                      }

                      const { data: publicData } = supabase
                        .storage
                        .from("steco-images")
                        .getPublicUrl(filePath);

                      const publicUrl = publicData?.publicUrl || "";
                      setImageUrl(publicUrl);
                      setPreviewUrl(publicUrl);
                      setUploadingImage(false);
                    }}
                    className="block w-full text-sm text-slate-100 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-[0.16em] file:text-slate-200 hover:file:bg-slate-700"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Fișierul va fi urcat în bucket-ul <code className="font-mono">steco-images</code> din Supabase
                    Storage, iar link-ul public va fi salvat automat pe pagină.
                  </p>
                  {uploadingImage && (
                    <p className="mt-1 text-[11px] text-slate-300">Se încarcă imaginea...</p>
                  )}
                  {uploadError && (
                    <p className="mt-1 text-[11px] text-red-300">{uploadError}</p>
                  )}
                  {previewUrl && (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-16 w-24 overflow-hidden rounded-md border border-slate-700 bg-slate-900">
                        <img
                          src={previewUrl}
                          alt="Preview imagine pagină"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <p className="max-w-xs text-[11px] text-slate-400 break-all">
                        {previewUrl}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="submit"
                  className="btn-primary px-8"
                  disabled={saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Se salvează..." : "Salvează modificările"}
                </button>

                {saveStatus === "success" && (
                  <p className="text-xs text-emerald-300">
                    Conținut salvat cu succes în <code className="font-mono">steco_pages</code>.
                  </p>
                )}
                {saveStatus === "error" && (
                  <p className="text-xs text-red-300">
                    A apărut o eroare la salvare. Verifică consola Supabase.
                  </p>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

