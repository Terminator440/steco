import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { clearSiteSettingsCache } from "../lib/siteSettings";
import { Notice, buttonClass, inputClass } from "./admin/ui";

const EVENT_LABELS = {
  nunta: "Nuntă",
  botez: "Botez",
  majorat: "Majorat",
  aniversare: "Aniversare",
  gender_reveal: "Gender reveal",
  candy_bar: "Candy bar",
  corporate: "Corporate",
  altul: "Alt eveniment"
};

const STATUS = {
  nou: { label: "Nouă", badge: "bg-magenta text-cream" },
  in_lucru: { label: "În lucru", badge: "bg-amber-100 text-amber-900" },
  finalizat: { label: "Finalizată", badge: "bg-emerald-100 text-emerald-900" }
};

const FILTERS = [
  { id: "deschise", label: "De rezolvat" },
  { id: "nou", label: "Noi" },
  { id: "finalizat", label: "Finalizate" },
  { id: "toate", label: "Toate" }
];

function formatDate(value, withTime = false) {
  if (!value) return "";
  return new Date(value).toLocaleString("ro-RO", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "long" });
}

function Panel({ title, intro, children }) {
  return (
    <section className="mx-auto max-w-[1200px] px-4 pb-24 sm:px-6">
      <h1 className="display text-[2rem] leading-none">{title}</h1>
      {intro && <p className="mt-2 max-w-[60ch] text-[0.9375rem] text-ink-soft">{intro}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function ContactRequestsPanel({ onChange }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("deschise");

  useEffect(() => {
    let active = true;
    supabase
      .from("steco_contact_requests")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) setError(`Cererile nu s-au încărcat: ${loadError.message}`);
        else setRequests(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function changeStatus(id, status) {
    const previous = requests;
    setRequests((prev) => prev.map((req) => (req.id === id ? { ...req, status } : req)));
    const { error: updateError } = await supabase.from("steco_contact_requests").update({ status }).eq("id", id);
    if (updateError) {
      setRequests(previous);
      setError(`Statusul nu s-a salvat: ${updateError.message}`);
      return;
    }
    onChange?.();
  }

  async function remove(req) {
    if (!window.confirm(`Ștergi definitiv cererea de la ${req.name}? Nu o mai poți recupera.`)) return;
    const { error: deleteError } = await supabase.from("steco_contact_requests").delete().eq("id", req.id);
    if (deleteError) {
      setError(`Cererea nu s-a șters: ${deleteError.message}`);
      return;
    }
    setRequests((prev) => prev.filter((r) => r.id !== req.id));
    onChange?.();
  }

  const visible = requests.filter((req) => {
    if (filter === "deschise") return req.status !== "finalizat";
    if (filter === "toate") return true;
    return req.status === filter;
  });

  return (
    <Panel
      title="Cereri de ofertă"
      intro="Mesajele trimise din formularul de pe pagina Contact. Schimbă statusul ca să știi ce ai rezolvat."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = requests.filter((req) =>
            f.id === "deschise" ? req.status !== "finalizat" : f.id === "toate" ? true : req.status === f.id
          ).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={[
                "rounded-full border px-4 py-1.5 text-[0.875rem] transition-colors",
                filter === f.id ? "border-plum bg-plum text-cream" : "border-line bg-white hover:border-ink/40"
              ].join(" ")}
            >
              {f.label} <span className="opacity-70">({n})</span>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="mb-4">
          <Notice type="error" onClose={() => setError("")}>
            {error}
          </Notice>
        </div>
      )}

      {loading ? (
        <p className="text-ink-soft">Se încarcă cererile...</p>
      ) : !visible.length ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-5 py-10 text-center text-ink-soft">
          {requests.length
            ? "Nu există cereri în această listă."
            : "Încă nu a trimis nimeni formularul. Cererile noi apar aici imediat."}
        </p>
      ) : (
        <ul className="grid gap-3">
          {visible.map((req) => (
            <li key={req.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[1.0625rem] font-semibold">{req.name}</p>
                    <span className={`rounded-full px-2.5 py-0.5 text-[0.75rem] font-semibold ${STATUS[req.status]?.badge}`}>
                      {STATUS[req.status]?.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.8125rem] text-ink-soft">Primită {formatDate(req.created_at, true)}</p>
                </div>
                <label className="flex items-center gap-2 text-[0.875rem] text-ink-soft">
                  Status
                  <select
                    value={req.status}
                    onChange={(e) => changeStatus(req.id, e.target.value)}
                    className={`${inputClass} w-auto py-1.5`}
                  >
                    {Object.entries(STATUS).map(([value, s]) => (
                      <option key={value} value={value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <dl className="mt-4 grid gap-x-8 gap-y-2 text-[0.9375rem] sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="text-[0.8125rem] text-ink-soft">Eveniment</dt>
                  <dd>{EVENT_LABELS[req.event_type] || req.event_type}</dd>
                </div>
                {req.event_date && (
                  <div>
                    <dt className="text-[0.8125rem] text-ink-soft">Data</dt>
                    <dd>{formatDate(req.event_date)}</dd>
                  </div>
                )}
                {req.guests && (
                  <div>
                    <dt className="text-[0.8125rem] text-ink-soft">Invitați</dt>
                    <dd>{req.guests}</dd>
                  </div>
                )}
                {req.location && (
                  <div>
                    <dt className="text-[0.8125rem] text-ink-soft">Locație</dt>
                    <dd>{req.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[0.8125rem] text-ink-soft">Email</dt>
                  <dd>
                    <a href={`mailto:${req.email}`} className="break-all text-plum underline">
                      {req.email}
                    </a>
                  </dd>
                </div>
                {req.phone && (
                  <div>
                    <dt className="text-[0.8125rem] text-ink-soft">Telefon</dt>
                    <dd>
                      <a href={`tel:${req.phone.replace(/\s+/g, "")}`} className="text-plum underline">
                        {req.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {req.message && (
                <p className="mt-4 whitespace-pre-line rounded-xl bg-paper/70 px-4 py-3 text-[0.9375rem]">{req.message}</p>
              )}

              <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-line pt-3">
                <a href={`mailto:${req.email}`} className={buttonClass.quiet}>
                  Răspunde pe email
                </a>
                <button type="button" onClick={() => remove(req)} className={buttonClass.danger}>
                  Șterge cererea
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

const SETTINGS_FIELDS = [
  { key: "email", label: "Email", type: "email", placeholder: "contact@exemplu.ro" },
  { key: "phone", label: "Telefon", type: "tel", placeholder: "07xx xxx xxx" },
  { key: "address", label: "Adresă", type: "textarea", placeholder: "Oraș, stradă" },
  { key: "instagram_url", label: "Instagram", type: "url", placeholder: "https://instagram.com/..." },
  { key: "facebook_url", label: "Facebook", type: "url", placeholder: "https://facebook.com/..." },
  { key: "tiktok_url", label: "TikTok", type: "url", placeholder: "https://tiktok.com/@..." }
];

export function SiteSettingsPanel() {
  const [values, setValues] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    supabase
      .from("steco_site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setNotice({ type: "error", text: `Datele nu s-au încărcat: ${error.message}` });
        setValues(data || {});
      });
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    const payload = Object.fromEntries(SETTINGS_FIELDS.map(({ key }) => [key, (values[key] || "").trim() || null]));
    const { error } = await supabase.from("steco_site_settings").update(payload).eq("id", 1);
    setSaving(false);

    if (error) {
      setNotice({ type: "error", text: `Datele nu s-au salvat. Linkurile trebuie să înceapă cu https://. (${error.message})` });
      return;
    }
    clearSiteSettingsCache();
    setNotice({ type: "success", text: "Am salvat datele de contact. Se văd pe site la următoarea deschidere a paginii." });
  }

  return (
    <Panel
      title="Date de contact"
      intro="Apar în subsolul site-ului, în meniu și lângă formularul de contact. Câmpurile goale nu apar pe site."
    >
      {!values ? (
        <p className="text-ink-soft">Se încarcă...</p>
      ) : (
        <form onSubmit={handleSave} className="grid max-w-3xl gap-5 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2 sm:p-6">
          {SETTINGS_FIELDS.map((field) => (
            <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
              <label htmlFor={`setting-${field.key}`} className="mb-1.5 block text-[0.875rem] font-medium">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={`setting-${field.key}`}
                  rows={2}
                  value={values[field.key] || ""}
                  placeholder={field.placeholder}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className={inputClass}
                />
              ) : (
                <input
                  id={`setting-${field.key}`}
                  type={field.type}
                  value={values[field.key] || ""}
                  placeholder={field.placeholder}
                  pattern={field.type === "url" ? "https://.*" : undefined}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  className={inputClass}
                />
              )}
            </div>
          ))}

          {notice && (
            <div className="sm:col-span-2">
              <Notice type={notice.type} onClose={() => setNotice(null)}>
                {notice.text}
              </Notice>
            </div>
          )}

          <div className="sm:col-span-2">
            <button type="submit" className={buttonClass.primary} disabled={saving}>
              {saving ? "Se salvează..." : "Salvează datele de contact"}
            </button>
          </div>
        </form>
      )}
    </Panel>
  );
}
